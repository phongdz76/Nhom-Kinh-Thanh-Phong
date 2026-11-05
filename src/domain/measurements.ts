/** UI uses metres; persisted dimensions remain integer millimetres. */
export function parseMetres(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/\s+/g, "");
  const match = /^(\d{1,2})(?:[.,](\d{0,3})m?|m(\d{0,3}))?$/.exec(text);
  if (!match) return null;
  const mm =
    Number(match[1]) * 1000 +
    Number((match[2] || match[3] || "").padEnd(3, "0"));
  return mm > 0 && mm <= 20000 ? mm : null;
}

export const formatMetres = (millimetres: number) =>
  millimetres
    ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(
        millimetres / 1000,
      )
    : "";
