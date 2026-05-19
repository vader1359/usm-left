import fs from "node:fs"
import path from "node:path"
import { parseAssemblyExcel, parseStockExcel } from "@/lib/parser"
import { computeResults } from "@/lib/optimizer"
import { getImageUrl } from "@/lib/image-url"
import type { BOM, Stock, ProductMap, Mode, BomRow, StockRow, StockItem } from "@/lib/types"

interface ProductJson {
  sku: string
  name: string
  imageUuid: string
  modifiedDate?: string
}

let productJsonCache: ProductJson[] | null = null

function loadProductJson(): ProductJson[] {
  if (productJsonCache) return productJsonCache
  const jsonPath = path.join(process.cwd(), "data", "usm-products.json")
  const raw = fs.readFileSync(jsonPath, "utf-8")
  productJsonCache = JSON.parse(raw) as ProductJson[]
  return productJsonCache
}

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

    if (mode !== "maximize" && mode !== "prioritized" && mode !== "independent" && mode !== "small-first" && mode !== "large-first") {
      return Response.json(
        { error: "Mode must be 'maximize', 'prioritized', 'independent', 'small-first', or 'large-first'" },
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

    const products = loadProductJson()
    const productMap: ProductMap = new Map()
    for (const p of products) {
      productMap.set(p.sku, { name: p.name, imageUuid: p.imageUuid })
    }

    // Enrich with stock file (fallback for SKUs not in JSON)
    for (const row of stockRows) {
      if (!productMap.has(row.sku)) {
        productMap.set(row.sku, { name: row.name, imageUuid: row.imageUuid })
      }
    }

    // Convert UUIDs to full image URLs; skip values that are already URLs
    for (const [, info] of productMap) {
      if (info.imageUuid && !info.imageUuid.startsWith("http")) {
        info.imageUuid = getImageUrl(info.imageUuid)
      }
    }

    const stockItems: StockItem[] = []
    const componentItems: StockItem[] = []
    for (const row of stockRows) {
      const info = productMap.get(row.sku)
      const item: StockItem = {
        sku: row.sku,
        name: info?.name ?? row.name,
        imageUrl: info?.imageUuid ?? "",
        availableQty: row.availableQty,
      }
      if (row.sku.startsWith("USMUS-") || row.sku.startsWith("USMUS0") || row.sku.startsWith("USMUS2")) {
        componentItems.push(item)
      } else {
        stockItems.push(item)
      }
    }

    const response = computeResults(bom, stock, productMap, mode, priorities)

    return Response.json({
      success: true,
      ...response,
      stockItems,
      componentItems,
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
