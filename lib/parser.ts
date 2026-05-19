import * as XLSX from "xlsx"
import type { BomRow, StockRow } from "./types"

export function parseAssemblyExcel(buffer: ArrayBuffer): BomRow[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: (string | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: undefined,
  })

  const bom: BomRow[] = []

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const cabinetSku = String(row[1] ?? "").trim()
    const partSku = String(row[4] ?? "").trim()
    const qtyRaw = String(row[7] ?? "").trim()

    if (!cabinetSku.startsWith("USMUS0") && !cabinetSku.startsWith("USMUS2")) continue
    if (!partSku) continue

    const qty = parseFloat(qtyRaw.replace(/,/g, ""))
    if (isNaN(qty) || qty <= 0) continue

    bom.push({ cabinetSku, partSku, qty })
  }

  return bom
}

export function parseStockExcel(buffer: ArrayBuffer): StockRow[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: (string | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: undefined,
  })

  const stock: StockRow[] = []

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue

    const sku = String(row[0] ?? "").trim()
    const origin = String(row[9] ?? "").trim()

    if (!sku) continue
    if (origin !== "USM") continue

    const name = String(row[2] ?? sku).trim()
    const imageUuid = String(row[1] ?? "").trim()
    const qtyRaw = String(row[3] ?? "").trim()

    const availableQty = parseFloat(qtyRaw.replace(/,/g, ""))
    if (isNaN(availableQty) || availableQty <= 0) continue

    stock.push({ sku, name, imageUuid, availableQty })
  }

  return stock
}
