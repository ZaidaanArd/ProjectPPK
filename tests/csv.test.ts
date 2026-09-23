import { describe, expect, it } from "vitest"
import { csvCell, csvDocument } from "../src/lib/csv"

describe("CSV export", () => {
  it("escapes quotes and prevents spreadsheet formulas", () => {
    expect(csvCell('Aula "Baru"')).toBe('"Aula ""Baru"""')
    for (const value of [
      "=1+1",
      "+SUM(1)",
      "-2+3",
      "@cmd",
      "  =1+1",
      "\t=1+1",
    ]) {
      expect(csvCell(value)).toBe(`"'${value}"`)
    }
    expect(csvDocument(["Nama"], [["Aula"]])).toBe('\uFEFF"Nama"\n"Aula"')
  })
})
