import { test, expect } from "./fixtures/browser";
import fs from "node:fs";
import dotenv from "dotenv";
import JSZip from "jszip";
import {
  calculateEstimate,
  calculateLine,
  estimateSchema,
  type EstimateLine,
} from "@/domain/estimates";

const env = dotenv.parse(fs.readFileSync(".env.test.local"));
const origin = "http://127.0.0.1:3010";
const line: EstimateLine = {
  id: "test-line",
  description: "Cửa thử",
  measurement: "dimensions",
  unit: "m2",
  width: 910,
  height: 2150,
  quantity: 4,
  volume: 0,
  unitPrice: 2_000_000,
  agreedAmount: null,
};

test("quotation arithmetic handles mm conversion, direct quantities, units, agreed amounts and dong rounding", () => {
  expect(calculateLine(line)).toMatchObject({
    volume: 7.826,
    amount: 15_652_000,
  });
  expect(
    calculateLine({
      ...line,
      measurement: "manual",
      volume: 7.826,
      width: 1,
      height: 1,
    }),
  ).toMatchObject({ volume: 7.826, amount: 15_652_000 });
  expect(
    calculateLine({ ...line, unit: "bo", quantity: 3, unitPrice: 1_000_000 }),
  ).toMatchObject({ volume: 3, amount: 3_000_000 });
  expect(
    calculateLine({
      ...line,
      unit: "md",
      width: 1500,
      quantity: 2,
      unitPrice: 100_000,
    }),
  ).toMatchObject({ volume: 3, amount: 300_000 });
  expect(calculateLine({ ...line, agreedAmount: 15_625_000 })).toMatchObject({
    baseAmount: 15_652_000,
    amount: 15_625_000,
    adjustment: -27000,
  });
  const halfDong = {
    ...line,
    measurement: "manual" as const,
    volume: 0.000001,
    unitPrice: 500000,
  };
  expect(calculateLine(halfDong).amount).toBe(1);
  const tiny = calculateEstimate({ lines: [halfDong], payments: [50, 50, 0] });
  expect(tiny.paymentAmounts).toEqual([1, 0, 0]);
  expect(tiny.paymentAmounts.reduce((sum, amount) => sum + amount, 0)).toBe(
    tiny.total,
  );
});

test("owner-only quotations persist, reject stale writes, and export genuine A4 Excel and Word documents", async ({
  playwright,
}) => {
  const owner = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  const editor = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  const anonymous = await playwright.request.newContext({ baseURL: origin });
  try {
    expect(
      (
        await owner.post("/api/auth/login", {
          data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await editor.post("/api/auth/login", {
          data: {
            email: "editor@thanhphong.test",
            password: env.EDITOR_PASSWORD,
          },
        })
      ).status(),
    ).toBe(200);
    expect((await anonymous.get("/api/admin/estimates")).status()).toBe(401);
    expect((await anonymous.get("/api/admin/estimates/example")).status()).toBe(
      401,
    );
    expect((await editor.get("/api/admin/estimates")).status()).toBe(403);
    expect((await editor.get("/api/admin/estimates/example")).status()).toBe(
      403,
    );
    const sample = await (
      await owner.get("/api/admin/estimates/example")
    ).json();
    expect(calculateEstimate(estimateSchema.parse(sample.document)).total).toBe(
      163_705_200,
    );
    expect(sample.originalTotal).toBe(163_522_000);
    const document = {
      ...sample.document,
      code: `BG-TEST-${Date.now()}`,
      customerName: "Khách kiểm thử nội bộ",
    };
    const created = await owner.post("/api/admin/estimates", {
      data: { document },
    });
    expect(created.status()).toBe(201);
    const record = await created.json();
    expect(record.calculation.paymentAmounts).toEqual([
      49_111_560, 81_852_600, 32_741_040,
    ]);
    expect(
      (
        await owner.post("/api/admin/estimates", { data: { document } })
      ).status(),
    ).toBe(409);
    expect(
      (await editor.get(`/api/admin/estimates/${record.id}`)).status(),
    ).toBe(403);
    for (const format of ["xlsx", "docx"]) {
      expect(
        (
          await anonymous.get(
            `/api/admin/estimates/${record.id}/export?format=${format}`,
          )
        ).status(),
      ).toBe(401);
      expect(
        (
          await editor.get(
            `/api/admin/estimates/${record.id}/export?format=${format}`,
          )
        ).status(),
      ).toBe(403);
    }
    const excel = await owner.get(
      `/api/admin/estimates/${record.id}/export?format=xlsx`,
    );
    expect(excel.status()).toBe(200);
    const xlsxZip = await JSZip.loadAsync(await excel.body());
    const sheet = await xlsxZip
      .file("xl/worksheets/sheet1.xml")!
      .async("string");
    for (const setting of [
      'paperSize="9"',
      'fitToPage="1"',
      'fitToWidth="1"',
      'fitToHeight="1"',
    ])
      expect(sheet).toContain(setting);
    const cellXml = (address: string) =>
      sheet.match(
        new RegExp(`<c\\b[^>]*\\br="${address}"[^>]*>([\\s\\S]*?)</c>`),
      )?.[1];
    expect(cellXml("G9")).toContain("<v>7.826</v>");
    expect(cellXml("I9")).toContain("<v>15652000</v>");
    expect(cellXml("I9")).toContain("IF(ISNUMBER(J9),J9,ROUND(G9*H9,0))");
    expect(cellXml("I23")).toContain("<v>163705200</v>");
    expect(sheet).toMatch(/<col\b[^>]*min="10"[^>]*hidden="1"/);
    const word = await owner.get(
      `/api/admin/estimates/${record.id}/export?format=docx`,
    );
    expect(word.status()).toBe(200);
    const zip = await JSZip.loadAsync(await word.body());
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("163.705.200");
    expect(xml).toContain('w:w="11906"');
    expect(xml).toContain('w:h="16838"');
    expect(xml).toContain("w:cantSplit");
    const changed = {
      ...document,
      lines: [
        { ...document.lines[0], agreedAmount: 15_625_000 },
        ...document.lines.slice(1),
      ],
    };
    const updated = await owner.patch(`/api/admin/estimates/${record.id}`, {
      data: { document: changed, updatedAt: record.updatedAt },
    });
    expect(updated.status()).toBe(200);
    expect((await updated.json()).calculation.total).toBe(163_678_200);
    expect(
      (
        await owner.patch(`/api/admin/estimates/${record.id}`, {
          data: { document, updatedAt: record.updatedAt },
        })
      ).status(),
    ).toBe(409);
    const reopened = await (
      await owner.get(`/api/admin/estimates/${record.id}`)
    ).json();
    expect(reopened.document.lines[0].agreedAmount).toBe(15_625_000);
    expect(
      (
        await owner.post("/api/admin/estimates", {
          data: {
            document: { ...document, code: "INVALID", payments: [30, 30, 30] },
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await owner.post("/api/admin/estimates", {
          data: {
            document: {
              ...document,
              code: "INVALID",
              lines: [{ ...line, volume: -1, measurement: "manual" }],
            },
          },
        })
      ).status(),
    ).toBe(400);
  } finally {
    await owner.dispose();
    await editor.dispose();
    await anonymous.dispose();
  }
});

test("admin can enter direct volume, save, download both files, and print the sample on one A4 page", async ({
  page,
  context,
}) => {
  expect(
    (
      await page.request.post(`${origin}/api/auth/login`, {
        headers: { Origin: origin },
        data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/admin?tab=estimates");
  await page
    .getByLabel("Khách hàng", { exact: true })
    .fill("Khách nhập khối lượng");
  await page
    .getByLabel("Diễn giải hạng mục 1", { exact: true })
    .fill("Kính cường lực");
  await page
    .getByLabel("Cách nhập hạng mục 1", { exact: true })
    .selectOption("manual");
  await page.getByLabel("Khối lượng hạng mục 1", { exact: true }).fill("7.826");
  await page
    .getByLabel("Đơn giá (đ) hạng mục 1", { exact: true })
    .fill("2000000");
  await expect(page.getByTestId("estimate-total")).toHaveText("15.652.000đ");
  await page
    .getByLabel("Dùng giá chốt riêng cho dòng này", { exact: true })
    .check();
  await page
    .getByLabel("Giá chốt hạng mục 1", { exact: true })
    .fill("15625000");
  await expect(page.getByTestId("estimate-total")).toHaveText("15.625.000đ");
  await page
    .getByLabel("Dùng giá chốt riêng cho dòng này", { exact: true })
    .uncheck();
  await expect(page.getByTestId("estimate-total")).toHaveText("15.652.000đ");
  await page.getByRole("button", { name: "Lưu báo giá", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu báo giá");
  for (const format of ["Excel (.xlsx)", "Word (.docx)"]) {
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `Xuất ${format}`, exact: true })
      .click();
    const download = await downloadEvent;
    expect(await download.failure()).toBeNull();
  }
  await page.getByRole("button", { name: "Nạp file mẫu", exact: true }).click();
  await expect(page.getByTestId("estimate-total")).toHaveText("163.705.200đ");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".admin-sidebar")).not.toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const popupEvent = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Lưu & in A4", exact: true }).click();
  const popup = await popupEvent;
  await expect(popup.locator(".estimate-paper")).toBeVisible();
  await popup.emulateMedia({ media: "print" });
  const pdf = await popup.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect([
    ...pdf.toString("latin1").matchAll(/\/Type\s*\/Page\b/g),
  ]).toHaveLength(1);
  const anonymous = await context.browser()!.newContext();
  try {
    const visitor = await anonymous.newPage();
    await visitor.goto(popup.url());
    await expect(visitor).toHaveURL(/\/admin\/login$/);
    await expect(visitor.locator(".estimate-paper")).toHaveCount(0);
  } finally {
    await anonymous.close();
    await popup.close();
  }
});
