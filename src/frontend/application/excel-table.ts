export type TableCellView = {
  address: string;
  text: string;
  kind: "text" | "number" | "readonly";
  formula?: string;
  rowSpan: number;
  colSpan: number;
  style: Record<string, string | number>;
};
export type TableView = {
  range: string;
  columns: { label: string; width: number }[];
  rows: { number: number; height: number; cells: TableCellView[] }[];
};
export interface ExcelTableSession {
  sheets: { id: number; name: string; range: string }[];
  view(sheetId: number, range: string): TableView;
  edit(sheetId: number, address: string, text: string): void;
  export(): Promise<Uint8Array>;
}
