import type { Cell, Worksheet, Color, Border } from "exceljs";
import type {
  ExcelTableSession,
  TableCellView,
  TableView,
} from "@/frontend/application/excel-table";
import { checkXlsxArchive } from "./xlsx-limits";

function columnName(column: number): string {
  let name = "";
  while (column) {
    name = String.fromCharCode(65 + ((column - 1) % 26)) + name;
    column = Math.floor((column - 1) / 26);
  }
  return name;
}
function coordinate(address: string) {
  const match = /^([A-Z]{1,3})([1-9]\d{0,6})$/.exec(address);
  if (!match) throw new Error("Nhập vùng bảng dạng A1:I30.");
  const col = [...match[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  const row = Number(match[2]);
  if (col > 16384 || row > 1048576)
    throw new Error("Vùng bảng vượt giới hạn Excel.");
  return { col, row };
}
function rectangle(range: string) {
  const parts = range.trim().toUpperCase().replaceAll("$", "").split(":");
  if (parts.length > 2)
    throw new Error("Chọn một vùng bảng liên tục, ví dụ A1:I30.");
  const start = coordinate(parts[0]);
  const end = coordinate(parts[1] || parts[0]);
  if (end.row < start.row || end.col < start.col)
    throw new Error("Ô cuối phải nằm sau ô đầu.");
  return { start, end };
}
function bounded(range: ReturnType<typeof rectangle>) {
  if (
    range.end.row - range.start.row >= 120 ||
    range.end.col - range.start.col >= 20
  )
    throw new Error(
      "Mỗi lần chỉnh tối đa 120 dòng × 20 cột. Hãy chọn vùng nhỏ hơn.",
    );
}
const color = (c?: Partial<Color>) =>
  c?.argb && /^[\da-f]{8}$/i.test(c.argb) ? `#${c.argb.slice(2)}` : undefined;
function cellStyle(cell: Cell): TableCellView["style"] {
  const style: TableCellView["style"] = {};
  const font = cell.font;
  if (font?.bold) style.fontWeight = 700;
  if (font?.italic) style.fontStyle = "italic";
  if (font?.size) style.fontSize = `${Math.max(10, Math.min(36, font.size))}pt`;
  if (color(font?.color)) style.color = color(font.color)!;
  const fill = cell.fill;
  if (
    fill?.type === "pattern" &&
    fill.pattern === "solid" &&
    color(fill.fgColor)
  )
    style.backgroundColor = color(fill.fgColor)!;
  const align = cell.alignment?.horizontal;
  if (align && ["left", "right", "center", "justify"].includes(align))
    style.textAlign = align;
  for (const side of ["top", "right", "bottom", "left"] as const) {
    const border: Partial<Border> | undefined = cell.border?.[side];
    if (border?.style)
      style[`border${side[0].toUpperCase()}${side.slice(1)}`] =
        `${["thick", "double"].includes(border.style) ? 3 : border.style === "medium" ? 2 : 1}px ${border.style === "double" ? "double" : border.style.includes("dash") ? "dashed" : "solid"} ${color(border.color) || "#9da9ad"}`;
  }
  return style;
}
function descriptor(
  cell: Cell,
): Pick<TableCellView, "text" | "kind" | "formula"> {
  if (
    cell.formula ||
    (typeof cell.value === "object" &&
      cell.value &&
      "sharedFormula" in cell.value)
  )
    return {
      text: cell.result == null ? "" : String(cell.result),
      kind: "readonly",
      formula: cell.formula || "Công thức liên kết",
    };
  if (typeof cell.value === "number")
    return { text: String(cell.value), kind: "number" };
  if (
    cell.value instanceof Date ||
    typeof cell.value === "boolean" ||
    (cell.value && typeof cell.value === "object" && "error" in cell.value)
  )
    return {
      text:
        cell.value instanceof Date
          ? cell.value.toISOString().slice(0, 10)
          : cell.text,
      kind: "readonly",
    };
  return { text: cell.text, kind: "text" };
}

export async function openExcelTable(
  bytes: ArrayBuffer,
): Promise<ExcelTableSession> {
  checkXlsxArchive(bytes);
  // Next's browser resolver uses ExcelJS's browser bundle; no Node file APIs.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes);
  } catch {
    throw new Error(
      "Không đọc được file .xlsx. Hãy mở và lưu lại bằng Excel rồi thử lại.",
    );
  }
  const worksheets = workbook.worksheets.filter(
    (sheet) => sheet.state === "visible",
  );
  if (!worksheets.length || workbook.worksheets.length > 30)
    throw new Error("File cần có sheet hiển thị và tối đa 30 sheet.");
  const sheets = worksheets.map((sheet) => {
    let top = Infinity,
      left = Infinity,
      bottom = 0,
      right = 0,
      count = 0;
    sheet.eachRow((row) =>
      row.eachCell((cell) => {
        if (++count > 50000)
          throw new Error("Sheet quá lớn (tối đa 50.000 ô có nội dung).");
        top = Math.min(top, Number(cell.row));
        left = Math.min(left, Number(cell.col));
        bottom = Math.max(bottom, Number(cell.row));
        right = Math.max(right, Number(cell.col));
      }),
    );
    return {
      id: sheet.id,
      name: sheet.name,
      range: bottom
        ? `${columnName(left)}${top}:${columnName(right)}${bottom}`
        : "A1:A1",
    };
  });
  const sheetById = (id: number): Worksheet => {
    const sheet = worksheets.find((s) => s.id === id);
    if (!sheet) throw new Error("Không tìm thấy sheet.");
    return sheet;
  };
  const originalKinds = new Map<string, TableCellView["kind"]>();
  return {
    sheets,
    view(id, selection) {
      const sheet = sheetById(id);
      const area = rectangle(selection);
      bounded(area);
      const merges = (sheet.model.merges as string[]).map(rectangle);
      // Include entire merged cells at the edges of the requested table.
      let changed = true;
      while (changed) {
        changed = false;
        for (const m of merges) {
          if (
            m.end.row < area.start.row ||
            m.start.row > area.end.row ||
            m.end.col < area.start.col ||
            m.start.col > area.end.col
          )
            continue;
          const before = JSON.stringify(area);
          area.start.row = Math.min(area.start.row, m.start.row);
          area.start.col = Math.min(area.start.col, m.start.col);
          area.end.row = Math.max(area.end.row, m.end.row);
          area.end.col = Math.max(area.end.col, m.end.col);
          if (before !== JSON.stringify(area)) changed = true;
        }
        bounded(area);
      }
      const table: TableView = {
        range: `${columnName(area.start.col)}${area.start.row}:${columnName(area.end.col)}${area.end.row}`,
        columns: [],
        rows: [],
      };
      for (let col = area.start.col; col <= area.end.col; col++)
        table.columns.push({
          label: columnName(col),
          width: Math.max(
            64,
            Math.min(600, (sheet.getColumn(col).width || 12) * 7 + 5),
          ),
        });
      for (let row = area.start.row; row <= area.end.row; row++) {
        const cells: TableCellView[] = [];
        for (let col = area.start.col; col <= area.end.col; col++) {
          const cell = sheet.getCell(row, col);
          if (cell.isMerged && cell.master.address !== cell.address) continue;
          const merge = merges.find(
            (m) => m.start.row === row && m.start.col === col,
          );
          cells.push({
            address: cell.address,
            ...descriptor(cell),
            rowSpan: merge ? merge.end.row - row + 1 : 1,
            colSpan: merge ? merge.end.col - col + 1 : 1,
            style: cellStyle(cell),
          });
        }
        table.rows.push({
          number: row,
          height: Math.max(
            30,
            Math.min(300, ((sheet.getRow(row).height || 22) * 4) / 3),
          ),
          cells,
        });
      }
      return table;
    },
    edit(id, address, text) {
      coordinate(address);
      if (text.length > 10000)
        throw new Error("Nội dung mỗi ô tối đa 10.000 ký tự.");
      const cell = sheetById(id).getCell(address);
      const info = descriptor(cell);
      if (
        info.kind === "readonly" ||
        (cell.isMerged && cell.master.address !== address)
      )
        throw new Error(
          "Ô công thức, ngày tháng và ô gộp phụ được giữ nguyên.",
        );
      const key = `${id}:${address}`;
      const kind = originalKinds.get(key) ?? info.kind;
      originalKinds.set(key, kind);
      if (kind === "number" && text.trim()) {
        if (
          !/^-?\d+(?:[.,]\d+)?$/.test(text.trim()) ||
          !Number.isFinite(Number(text.replace(",", ".")))
        )
          throw new Error(
            `Ô ${address}: nhập số, dùng dấu phẩy hoặc chấm thập phân; không dùng dấu phân cách hàng nghìn.`,
          );
        cell.value = Number(text.replace(",", "."));
      } else cell.value = text || null;
    },
    async export() {
      workbook.calcProperties.fullCalcOnLoad = true;
      return new Uint8Array(await workbook.xlsx.writeBuffer());
    },
  };
}
