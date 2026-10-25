import "server-only";
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  TableLayoutType,
  AlignmentType,
  BorderStyle,
} from "docx";
import {
  calculateEstimate,
  formatMoney,
  formatVolume,
  paymentLabels,
  unitLabel,
  type Estimate,
} from "@/domain/estimates";

const headers = [
  "STT",
  "DIỄN GIẢI",
  "RỘNG\n(mm)",
  "CAO\n(mm)",
  "SL",
  "ĐVT",
  "KHỐI LƯỢNG",
  "ĐƠN GIÁ\n(đ)",
  "THÀNH TIỀN\n(đ)",
];
const border = { style: "thin" as const, color: { argb: "FF9DA9AD" } };
const dateLabel = (date: string) => date.split("-").reverse().join("/");

export async function exportEstimateExcel(doc: Estimate) {
  const calculation = calculateEstimate(doc);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = doc.companyName;
  workbook.calcProperties.fullCalcOnLoad = true;
  const sheet = workbook.addWorksheet("Bao gia", {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.35,
        bottom: 0.35,
        header: 0.1,
        footer: 0.1,
      },
    },
    views: [{ showGridLines: false, state: "frozen", ySplit: 8 }],
  });
  [5, 43, 8, 8, 6, 7, 12, 15, 17, 14].forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });
  sheet.getColumn(10).hidden = true;
  function merged(row: number, text: string, fontSize = 11, bold = false) {
    sheet.mergeCells(row, 1, row, 9);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = {
      name: "Arial",
      size: fontSize,
      bold,
      color: { argb: "FF1D2C40" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    sheet.getRow(row).height = fontSize + 9;
  }
  merged(1, doc.companyName, 15, true);
  merged(
    2,
    [doc.companyAddress, doc.companyPhone && `ĐT: ${doc.companyPhone}`]
      .filter(Boolean)
      .join(" · "),
    9,
  );
  sheet.getRow(2).height = doc.companyAddress.length > 80 ? 28 : 20;
  merged(4, doc.title, 14, true);
  merged(5, `Số: ${doc.code} · Ngày: ${dateLabel(doc.date)}`, 9);
  merged(6, `Kính gửi: ${doc.customerName}`);
  merged(7, `Công trình: ${doc.projectAddress || "—"}`);
  [6, 7].forEach((r) => {
    sheet.getCell(r, 1).alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };
  });
  sheet.getRow(7).height = doc.projectAddress.length > 100 ? 30 : 23;
  sheet.getRow(8).values = headers;
  sheet.getRow(8).height = 30;
  sheet.getRow(8).eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D2C40" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });
  calculation.lines.forEach((line, i) => {
    const r = i + 9;
    const row = sheet.getRow(r);
    row.values = [
      i + 1,
      line.description + (line.agreedAmount !== null ? " (giá chốt)" : ""),
      line.width || null,
      line.height || null,
      line.quantity,
      unitLabel[line.unit],
      null,
      line.unitPrice,
      null,
      line.agreedAmount,
    ];
    const formula =
      line.unit === "m2"
        ? `C${r}*D${r}*E${r}/1000000`
        : line.unit === "md"
          ? `C${r}*E${r}/1000`
          : `E${r}`;
    sheet.getCell(`G${r}`).value =
      line.measurement === "manual"
        ? line.volume
        : { formula, result: line.volume };
    sheet.getCell(`I${r}`).value = {
      formula: `IF(ISNUMBER(J${r}),J${r},ROUND(G${r}*H${r},0))`,
      result: line.amount,
    };
    sheet.getCell(`G${r}`).numFmt = "0.######";
    ["H", "I", "J"].forEach((c) => {
      sheet.getCell(`${c}${r}`).numFmt = "#,##0";
    });
    row.height = Math.max(
      30,
      (line.description
        .split("\n")
        .reduce(
          (sum, paragraph) =>
            sum + Math.max(1, Math.ceil(paragraph.length / 39)),
          0,
        ) +
        (line.agreedAmount !== null ? 1 : 0)) *
        13 +
        8,
    );
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = { name: "Arial", size: 10 };
      cell.alignment = {
        horizontal: col === 2 ? "left" : col >= 7 ? "right" : "center",
        vertical: "middle",
        wrapText: true,
      };
      if (col <= 9)
        cell.border = {
          top: border,
          right: border,
          bottom: border,
          left: border,
        };
    });
  });
  const last = 8 + doc.lines.length;
  const totalRow = last + 1;
  sheet.mergeCells(totalRow, 1, totalRow, 8);
  sheet.getCell(totalRow, 1).value = "TỔNG CỘNG (đồng)";
  sheet.getCell(`I${totalRow}`).value = {
    formula: `SUM(I9:I${last})`,
    result: calculation.total,
  };
  sheet.getRow(totalRow).font = { name: "Arial", bold: true, size: 11 };
  sheet.getRow(totalRow).height = 27;
  sheet.getCell(`I${totalRow}`).numFmt = "#,##0";
  sheet.getRow(totalRow).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEAF1EE" },
  };
  const firstPaymentRow = totalRow + 2;
  doc.payments.forEach((percent, i) => {
    const r = firstPaymentRow + i;
    sheet.mergeCells(r, 1, r, 8);
    sheet.getCell(r, 1).value = `${paymentLabels[i]} (${percent}%)`;
    sheet.getCell(`I${r}`).value = {
      formula:
        i === 0
          ? `ROUND(I${totalRow}*${percent}/100,0)`
          : i === 1
            ? `MIN(I${totalRow}-I${firstPaymentRow},ROUND(I${totalRow}*${percent}/100,0))`
            : `I${totalRow}-SUM(I${firstPaymentRow}:I${firstPaymentRow + 1})`,
      result: calculation.paymentAmounts[i],
    };
    sheet.getCell(`I${r}`).numFmt = "#,##0";
    sheet.getRow(r).font = { name: "Arial", size: 10 };
    sheet.getRow(r).height = 21;
  });
  let end = firstPaymentRow + 4;
  if (doc.notes) {
    merged(end, `Ghi chú: ${doc.notes}`, 9);
    sheet.getRow(end).height = Math.max(
      25,
      Math.ceil(doc.notes.length / 110) * 13,
    );
    end += 2;
  }
  if (calculation.lines.some((line) => line.agreedAmount !== null)) {
    merged(
      end++,
      "Các dòng ghi “giá chốt” dùng số tiền thỏa thuận thay cho khối lượng × đơn giá.",
      9,
    );
  }
  merged(
    end++,
    "ĐẠI DIỆN CỬA HÀNG                                      KHÁCH HÀNG",
    10,
    true,
  );
  sheet.getRow(end++).height = 32;
  merged(end++, doc.signatory, 10, true);
  sheet.pageSetup.printArea = `A1:I${end}`;
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportEstimateWord(doc: Estimate) {
  const calculation = calculateEstimate(doc);
  const contentSize = doc.lines.reduce(
    (sum, line) => sum + Math.max(2, Math.ceil(line.description.length / 40)),
    0,
  );
  const fontSize = contentSize > 60 ? 15 : contentSize > 42 ? 17 : 19;
  function paragraph(
    text: string,
    options: {
      bold?: boolean;
      center?: boolean;
      size?: number;
      after?: number;
    } = {},
  ) {
    return new Paragraph({
      alignment: options.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: {
        after: options.after ?? 55,
        before: 0,
        line: Math.round(fontSize * 12),
      },
      children: text.split("\n").map(
        (part, i) =>
          new TextRun({
            text: part,
            break: i ? 1 : 0,
            font: "Arial",
            size: options.size || fontSize,
            bold: options.bold || false,
          }),
      ),
    });
  }
  const widths = [450, 3300, 700, 700, 500, 600, 1200, 1500, 1822];
  function cell(text: string, index: number, heading = false) {
    return new TableCell({
      width: { size: widths[index], type: WidthType.DXA },
      shading: heading ? { fill: "EAF1EE" } : undefined,
      margins: { top: 55, bottom: 55, left: 45, right: 45 },
      children: [
        paragraph(text, {
          bold: heading,
          center: index !== 1,
          size: heading ? Math.min(fontSize, 17) : fontSize,
          after: 0,
        }),
      ],
    });
  }
  const rows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headers.map((value, i) =>
        cell(value.replace("\n", " "), i, true),
      ),
    }),
  ];
  calculation.lines.forEach((line, i) => {
    const values = [
      String(i + 1),
      line.description + (line.agreedAmount !== null ? " (giá chốt)" : ""),
      line.width ? formatMoney(line.width) : "—",
      line.height ? formatMoney(line.height) : "—",
      String(line.quantity),
      unitLabel[line.unit],
      formatVolume(line.volume),
      formatMoney(line.unitPrice),
      formatMoney(line.amount),
    ];
    rows.push(
      new TableRow({
        cantSplit: true,
        children: values.map((value, j) => cell(value, j)),
      }),
    );
  });
  const table = new Table({
    width: { size: 10772, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: Object.fromEntries(
      [
        "top",
        "bottom",
        "left",
        "right",
        "insideHorizontal",
        "insideVertical",
      ].map((side) => [
        side,
        { style: BorderStyle.SINGLE, size: 4, color: "9DA9AD" },
      ]),
    ),
    rows,
  });
  const children = [
    paragraph(doc.companyName, {
      bold: true,
      center: true,
      size: 26,
      after: 65,
    }),
    paragraph(
      [doc.companyAddress, doc.companyPhone && `ĐT: ${doc.companyPhone}`]
        .filter(Boolean)
        .join(" · "),
      { center: true, size: 16, after: 90 },
    ),
    paragraph(doc.title, { bold: true, center: true, size: 24, after: 70 }),
    paragraph(`Số: ${doc.code} · Ngày: ${dateLabel(doc.date)}`, {
      center: true,
      size: 17,
      after: 70,
    }),
    paragraph(`Kính gửi: ${doc.customerName}`),
    paragraph(`Công trình: ${doc.projectAddress || "—"}`, { after: 75 }),
    table,
    paragraph(`TỔNG CỘNG: ${formatMoney(calculation.total)} đồng`, {
      bold: true,
      after: 100,
    }),
    ...doc.payments.map((percent, i) =>
      paragraph(
        `${paymentLabels[i]} (${percent}%): ${formatMoney(calculation.paymentAmounts[i])} đồng`,
        { size: Math.min(fontSize, 18) },
      ),
    ),
    ...(doc.notes
      ? [
          paragraph(`Ghi chú: ${doc.notes}`, {
            size: Math.min(fontSize, 17),
            after: 65,
          }),
        ]
      : []),
    ...(calculation.lines.some((line) => line.agreedAmount !== null)
      ? [
          paragraph(
            "Các dòng ghi “giá chốt” dùng số tiền thỏa thuận thay cho khối lượng × đơn giá.",
            { size: 16 },
          ),
        ]
      : []),
    paragraph(
      "ĐẠI DIỆN CỬA HÀNG                                     KHÁCH HÀNG",
      { bold: true, center: true, after: 300 },
    ),
    paragraph(doc.signatory, { bold: true }),
  ];
  return Packer.toBuffer(
    new Document({
      creator: doc.companyName,
      title: `${doc.title} ${doc.code}`,
      styles: {
        default: { document: { run: { font: "Arial", size: fontSize } } },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 567, bottom: 567, left: 567, right: 567 },
            },
          },
          children,
        },
      ],
    }),
  );
}
