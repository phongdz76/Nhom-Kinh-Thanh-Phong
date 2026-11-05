import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMetres, parseMetres } from "../../src/domain/measurements";
import { calculateLine } from "../../src/domain/estimates";

test("metre input accepts Vietnamese spoken dimensions without changing stored mm or amounts", () => {
  for (const value of ["2m34", "2,34", "2.34", " 2 m 34 "])
    assert.equal(parseMetres(value), 2340);
  assert.equal(parseMetres("0m456"), 456);
  assert.equal(parseMetres("0,001"), 1);
  assert.equal(parseMetres("20"), 20000);
  assert.equal(formatMetres(2340), "2,34");
  assert.equal(formatMetres(456), "0,456");
  for (const value of [
    "",
    "0",
    "-2",
    "20,001",
    "2,3456",
    "2.3.4",
    "2,3m4",
    "2e3",
    "2340",
    "2mm",
    "2m34m",
  ])
    assert.equal(parseMetres(value), null, value);
  assert.equal(
    calculateLine({
      id: "metres",
      description: "Kính",
      unit: "m2",
      measurement: "dimensions",
      width: parseMetres("2m34")!,
      height: parseMetres("0m456")!,
      quantity: 1,
      volume: 0,
      unitPrice: 2000000,
      agreedAmount: null,
    }).amount,
    2134080,
  );
});
