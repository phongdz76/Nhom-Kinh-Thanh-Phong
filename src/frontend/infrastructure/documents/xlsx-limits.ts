const invalid = () =>
  new Error(
    "File Excel không hợp lệ. Chọn file .xlsx không có mật khẩu, macro hoặc liên kết dữ liệu bên ngoài.",
  );

/** Check ZIP metadata before ExcelJS inflates an untrusted workbook. */
export function checkXlsxArchive(bytes: ArrayBuffer) {
  if (bytes.byteLength > 5 * 1024 * 1024)
    throw new Error("File Excel tối đa 5 MB.");
  const view = new DataView(bytes);
  let end = -1;
  for (
    let i = bytes.byteLength - 22;
    i >= Math.max(0, bytes.byteLength - 65557);
    i--
  ) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.byteLength
    ) {
      end = i;
      break;
    }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true))
    throw invalid();
  const count = view.getUint16(end + 10, true);
  if (!count || count > 1024 || count !== view.getUint16(end + 8, true))
    throw invalid();
  let position = view.getUint32(end + 16, true);
  const directoryEnd = position + view.getUint32(end + 12, true);
  if (directoryEnd !== end) throw invalid();
  let expandedSize = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || view.getUint32(position, true) !== 0x02014b50)
      throw invalid();
    const nameSize = view.getUint16(position + 28, true);
    const next =
      position +
      46 +
      nameSize +
      view.getUint16(position + 30, true) +
      view.getUint16(position + 32, true);
    if (next > end || view.getUint16(position + 8, true) & 1) throw invalid();
    const name = new TextDecoder().decode(
      new Uint8Array(bytes, position + 46, nameSize),
    );
    if (
      names.has(name) ||
      /(?:^|\/)\.\.(?:\/|$)|\\|^\//.test(name) ||
      /vbaProject|externalLinks|connections\.xml/i.test(name)
    )
      throw invalid();
    names.add(name);
    expandedSize += view.getUint32(position + 24, true);
    if (expandedSize > 24 * 1024 * 1024)
      throw new Error("File Excel sau giải nén quá lớn (tối đa 24 MB).");
    position = next;
  }
  if (
    position !== directoryEnd ||
    !names.has("xl/workbook.xml") ||
    !names.has("[Content_Types].xml")
  )
    throw invalid();
}
