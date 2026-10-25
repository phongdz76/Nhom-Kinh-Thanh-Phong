import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const money = z.number().int().min(0).max(1_000_000_000_000);
export const estimateLineSchema = z
  .object({
    id: text(60).min(1),
    description: text(400).min(1, "Nhập diễn giải hạng mục."),
    unit: z.enum(["m2", "bo", "md"]),
    measurement: z.enum(["dimensions", "manual"]),
    width: z.number().int().min(0).max(20000),
    height: z.number().int().min(0).max(20000),
    quantity: z.number().int().min(1).max(1000),
    volume: z
      .number()
      .min(0)
      .max(1_000_000)
      .refine(
        (v) => Math.abs(v * 1e6 - Math.round(v * 1e6)) < 0.001,
        "Khối lượng tối đa 6 chữ số thập phân.",
      ),
    unitPrice: z.number().int().min(0).max(100_000_000),
    agreedAmount: money.nullable(),
  })
  .strict()
  .superRefine((line, ctx) => {
    if (line.measurement === "manual" && line.volume <= 0)
      ctx.addIssue({
        code: "custom",
        message: "Khối lượng nhập trực tiếp phải lớn hơn 0.",
        path: ["volume"],
      });
    if (
      line.measurement === "dimensions" &&
      line.unit !== "bo" &&
      line.width <= 0
    )
      ctx.addIssue({
        code: "custom",
        message: "Chiều rộng / chiều dài phải lớn hơn 0 mm.",
        path: ["width"],
      });
    if (
      line.measurement === "dimensions" &&
      line.unit === "m2" &&
      line.height <= 0
    )
      ctx.addIssue({
        code: "custom",
        message: "Chiều cao phải lớn hơn 0 mm.",
        path: ["height"],
      });
  });
export const estimateSchema = z
  .object({
    code: text(40).regex(
      /^[a-zA-Z0-9_-]+$/,
      "Mã báo giá chỉ dùng chữ, số và dấu gạch ngang.",
    ),
    date: z.iso.date(),
    title: z.enum([
      "BẢNG BÁO GIÁ NHÔM KÍNH",
      "BẢNG QUYẾT TOÁN KHỐI LƯỢNG NHÔM KÍNH",
    ]),
    companyName: text(150).min(2),
    companyAddress: text(300),
    companyPhone: text(100),
    customerName: text(100).min(2, "Nhập tên khách hàng."),
    projectAddress: text(300),
    signatory: text(100),
    notes: text(800),
    payments: z
      .tuple([
        z.number().int().min(0).max(100),
        z.number().int().min(0).max(100),
        z.number().int().min(0).max(100),
      ])
      .refine(
        (rates) => rates.reduce((sum, v) => sum + v, 0) === 100,
        "Ba đợt thanh toán phải đủ 100%.",
      ),
    lines: z.array(estimateLineSchema).min(1).max(40),
  })
  .strict()
  .superRefine((doc, ctx) => {
    if (calculateEstimate(doc).total > 1_000_000_000_000)
      ctx.addIssue({
        code: "custom",
        message: "Tổng báo giá tối đa 1.000 tỷ đồng.",
        path: ["lines"],
      });
  });
export type Estimate = z.infer<typeof estimateSchema>;
export type EstimateLine = z.infer<typeof estimateLineSchema>;
export const unitLabel = { m2: "m²", bo: "bộ", md: "m dài" };
const roundedDong = (numerator: bigint) =>
  Number((numerator + 500_000n) / 1_000_000n);
export function calculateLine(line: EstimateLine) {
  const micros =
    line.measurement === "manual"
      ? BigInt(Math.round((Number(line.volume) || 0) * 1e6))
      : line.unit === "bo"
        ? BigInt(line.quantity || 0) * 1_000_000n
        : line.unit === "md"
          ? BigInt(line.width || 0) * BigInt(line.quantity || 0) * 1000n
          : BigInt(line.width || 0) *
            BigInt(line.height || 0) *
            BigInt(line.quantity || 0);
  const baseAmount = roundedDong(micros * BigInt(line.unitPrice || 0));
  const amount = line.agreedAmount === null ? baseAmount : line.agreedAmount;
  return {
    ...line,
    volume: Number(micros) / 1e6,
    baseAmount,
    amount,
    adjustment: amount - baseAmount,
  };
}
export function calculateEstimate(doc: Pick<Estimate, "lines" | "payments">) {
  const lines = doc.lines.map(calculateLine);
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const baseTotal = lines.reduce((sum, line) => sum + line.baseAmount, 0);
  const first = Math.round((total * doc.payments[0]) / 100);
  const second = Math.min(
    total - first,
    Math.round((total * doc.payments[1]) / 100),
  );
  return {
    lines,
    total,
    baseTotal,
    adjustment: total - baseTotal,
    paymentAmounts: [first, second, total - first - second],
  };
}
export const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
export const formatVolume = (value: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(value);
export const paymentLabels = [
  "Sau khi ký hợp đồng",
  "Khi chuyển hàng đến lắp đặt",
  "Sau nghiệm thu, bàn giao",
];
