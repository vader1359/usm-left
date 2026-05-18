import { parseAssemblyExcel, parseStockExcel } from "@/lib/parser"
import { computeResults } from "@/lib/optimizer"
import { fetchAmisProducts } from "@/lib/amis-products"
import { getImageUrl } from "@/lib/image-url"
import type { BOM, Stock, ProductMap, Mode, BomRow, StockRow } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const assemblyFile = formData.get("assembly") as File | null
    const stockFile = formData.get("stock") as File | null
    const mode = (formData.get("mode") as string) as Mode
    const prioritiesRaw = formData.get("priorities") as string | null

    if (!assemblyFile || !stockFile || !mode) {
      return Response.json(
        { error: "Missing assembly file, stock file, or mode" },
        { status: 400 },
      )
    }

    if (mode !== "maximize" && mode !== "prioritized" && mode !== "independent") {
      return Response.json(
        { error: "Mode must be 'maximize', 'prioritized', or 'independent'" },
        { status: 400 },
      )
    }

    const assemblyBuffer = await assemblyFile.arrayBuffer()
    const stockBuffer = await stockFile.arrayBuffer()

    const bomRows: BomRow[] = parseAssemblyExcel(assemblyBuffer)
    const stockRows: StockRow[] = parseStockExcel(stockBuffer)

    if (bomRows.length === 0) {
      return Response.json(
        { error: "No USM BOM rows found in assembly file" },
        { status: 400 },
      )
    }

    if (stockRows.length === 0) {
      return Response.json(
        { error: "No USM stock items found in stock file" },
        { status: 400 },
      )
    }

    const bom: BOM = new Map()
    for (const row of bomRows) {
      const existing = bom.get(row.cabinetSku) ?? []
      existing.push({ partSku: row.partSku, qty: row.qty })
      bom.set(row.cabinetSku, existing)
    }

    const stock: Stock = new Map()
    for (const row of stockRows) {
      stock.set(row.sku, row.availableQty)
    }

    let priorities: string[] | undefined
    if (prioritiesRaw) {
      try {
        priorities = JSON.parse(prioritiesRaw)
      } catch {
        priorities = undefined
      }
    }

    let productMap: ProductMap = new Map()
    try {
      const amisProducts = await fetchAmisProducts()
      for (const p of amisProducts) {
        productMap.set(p.sku, { name: p.name, imageUuid: p.imageUuid })
      }
    } catch {
      // AMIS unavailable — fall back to stock file names
    }

    // Enrich product map with stock file data
    // Stock file is primary for images (AMIS may not have avatar for all)
    for (const row of stockRows) {
      const existing = productMap.get(row.sku)
      if (!existing) {
        productMap.set(row.sku, { name: row.name, imageUuid: row.imageUuid })
      } else if (!existing.imageUuid && row.imageUuid) {
        existing.imageUuid = row.imageUuid
      }
    }

    // Resolve image URLs
    for (const [sku, info] of productMap) {
      if (info.imageUuid) {
        info.imageUuid = getImageUrl(info.imageUuid)
      }
    }

    const response = computeResults(bom, stock, productMap, mode, priorities)

    return Response.json({
      success: true,
      ...response,
      meta: {
        cabinetTypes: bom.size,
        partTypes: stock.size,
        bomRows: bomRows.length,
        stockRows: stockRows.length,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Calculate error:", message)
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
