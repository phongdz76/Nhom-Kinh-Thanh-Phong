import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { openExcelTable } from "../../src/frontend/infrastructure/documents/excel-table";
import { checkXlsxArchive } from "../../src/frontend/infrastructure/documents/xlsx-limits";

async function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Bảng khách");
  sheet.mergeCells("A1:D2");
  sheet.getCell("A1").value = "BÁO GIÁ CỦA KHÁCH";
  sheet.getCell("A1").font = { bold: true, size: 16 };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF123456" },
  };
  sheet.getColumn("A").width = 34;
  sheet.getRow(3).height = 42;
  sheet.getCell("A3").value = "Cửa nhôm";
  sheet.getCell("B3").value = 2.34;
  sheet.getCell("B3").numFmt = "0.000";
  sheet.getCell("B3").border = {
    bottom: { style: "double", color: { argb: "FF123456" } },
  };
  sheet.getCell("C3").value = 1000000;
  sheet.getCell("D3").value = { formula: "B3*C3", result: 2340000 };
  workbook.addWorksheet("Khác").getCell("A1").value = "Giữ nguyên";
  return new Uint8Array(await workbook.xlsx.writeBuffer()).buffer;
}
test("customer table edits retain merged layout, formats, formulas and other sheets on round trip", async () => {
  const session = await openExcelTable(await fixture());
  const id = session.sheets[0].id;
  const view = session.view(id, "B2:D3");
  assert.equal(view.range, "A1:D3");
  assert.equal(view.rows[0].cells[0].rowSpan, 2);
  assert.equal(view.rows[0].cells[0].colSpan, 4);
  assert.equal(view.rows[0].cells[0].style.backgroundColor, "#123456");
  session.edit(id, "A3", "Cửa sửa lại");
  session.edit(id, "B3", "0,456");
  assert.throws(() => session.edit(id, "D3", "1"), /giữ nguyên/);
  assert.throws(() => session.edit(id, "B3", "1.000.000"), /phân cách/);
  session.edit(id, "B3", "");
  assert.throws(() => session.edit(id, "B3", "abc"), /nhập số/);
  session.edit(id, "B3", "2.34");
  // User input beginning with '=' must stay literal text, never become a formula.
  session.edit(id, "A3", '=HYPERLINK("https://example.test")');
  const result = new ExcelJS.Workbook();
  const exported = new Uint8Array(await session.export()).buffer;
  await result.xlsx.load(exported);
  const sheet = result.getWorksheet("Bảng khách")!;
  assert.deepEqual(sheet.model.merges, ["A1:D2"]);
  assert.equal(sheet.getColumn("A").width, 34);
  assert.equal(sheet.getRow(3).height, 42);
  assert.equal(sheet.getCell("B3").numFmt, "0.000");
  assert.equal(sheet.getCell("B3").border.bottom?.style, "double");
  assert.equal(sheet.getCell("B3").value, 2.34);
  assert.equal(sheet.getCell("A3").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("D3").formula, "B3*C3");
  assert.equal(result.getWorksheet("Khác")!.getCell("A1").value, "Giữ nguyên");
  const zip = await JSZip.loadAsync(exported);
  assert.match(
    await zip.file("xl/workbook.xml")!.async("string"),
    /fullCalcOnLoad="1"/,
  );
  assert.throws(() => session.view(id, "A1:XFD1048576"), /120 dòng/);
  assert.throws(() => session.view(id, "D4:A1"), /Ô cuối/);
});
test("import rejects non-xlsx, huge expanded archives and external workbook data", async () => {
  assert.throws(() => checkXlsxArchive(new ArrayBuffer(10)), /không hợp lệ/);
  const archive = await JSZip.loadAsync(await fixture());
  archive.file("xl/externalLinks/externalLink1.xml", "external");
  const external = await archive.generateAsync({ type: "arraybuffer" });
  assert.throws(() => checkXlsxArchive(external), /không hợp lệ/);
  archive.remove("xl/externalLinks");
  archive.file("large.xml", "a".repeat(25 * 1024 * 1024));
  const bomb = await archive.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
  });
  assert.throws(() => checkXlsxArchive(bomb), /giải nén quá lớn/);
});
