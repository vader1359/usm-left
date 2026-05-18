import type { BOM, Stock, Mode, CabinetResult, ProductMap, CalculateResponse } from "./types"

function howManyCanBuild(
  cabinetSku: string,
  bom: BOM,
  stock: Stock,
): number {
  const parts = bom.get(cabinetSku)
  if (!parts || parts.length === 0) return 0

  let max = Infinity
  for (const { partSku, qty } of parts) {
    const available = stock.get(partSku) ?? 0
    const canMake = Math.floor(available / qty)
    if (canMake < max) max = canMake
    if (max === 0) break
  }

  return max === Infinity ? 0 : max
}

function deduct(
  cabinetSku: string,
  bom: BOM,
  stock: Stock,
  count: number,
) {
  const parts = bom.get(cabinetSku)
  if (!parts) return

  for (const { partSku, qty } of parts) {
    const current = stock.get(partSku) ?? 0
    stock.set(partSku, Math.max(0, current - qty * count))
  }
}

function copyStock(stock: Stock): Stock {
  return new Map(stock)
}

export function calculateMaximize(
  cabinetSkus: string[],
  bom: BOM,
  stock: Stock,
): Map<string, number> {
  const remaining = copyStock(stock)
  const results = new Map<string, number>()

  let built = true
  while (built) {
    built = false
    let bestSku = ""
    let bestCount = 0

    for (const sku of cabinetSkus) {
      const count = howManyCanBuild(sku, bom, remaining)
      if (count > bestCount) {
        bestCount = count
        bestSku = sku
      }
    }

    if (bestCount > 0) {
      results.set(bestSku, (results.get(bestSku) ?? 0) + 1)
      deduct(bestSku, bom, remaining, 1)
      built = true
    }
  }

  return results
}

export function calculatePrioritized(
  priorities: string[],
  bom: BOM,
  stock: Stock,
): Map<string, number> {
  const remaining = copyStock(stock)
  const results = new Map<string, number>()

  for (const sku of priorities) {
    if (!bom.has(sku)) continue
    const count = howManyCanBuild(sku, bom, remaining)
    if (count > 0) {
      results.set(sku, count)
      deduct(sku, bom, remaining, count)
    }
  }

  return results
}

function calculateIndependent(
  cabinetSkus: string[],
  bom: BOM,
  stock: Stock,
): Map<string, number> {
  const results = new Map<string, number>()
  for (const sku of cabinetSkus) {
    const count = howManyCanBuild(sku, bom, stock)
    if (count > 0) {
      results.set(sku, count)
    }
  }
  return results
}

export function optimize(
  cabinetSkus: string[],
  bom: BOM,
  stock: Stock,
  mode: Mode,
  priorities?: string[],
): Map<string, number> {
  if (mode === "independent") {
    return calculateIndependent(cabinetSkus, bom, stock)
  }

  if (mode === "prioritized" && priorities && priorities.length > 0) {
    const sorted = priorities.filter((s) => bom.has(s))
    const remaining = cabinetSkus.filter((s) => !sorted.includes(s))
    sorted.push(...remaining)
    return calculatePrioritized(sorted, bom, stock)
  }

  return calculateMaximize(cabinetSkus, bom, stock)
}

export function computeResults(
  bom: BOM,
  stock: Stock,
  products: ProductMap,
  mode: Mode,
  priorities?: string[],
): CalculateResponse {
  const cabinetSkus = Array.from(bom.keys())

  const stockMap = new Map<string, number>()
  for (const [sku, qty] of stock) {
    stockMap.set(sku, qty)
  }

  const producible = optimize(cabinetSkus, bom, stockMap, mode, priorities)

  const totalInitial = stockMap.size
  let consumedCount = 0

  const results: CabinetResult[] = cabinetSkus
    .filter((sku) => producible.has(sku) && (producible.get(sku) ?? 0) > 0)
    .map((sku) => {
      const product = products.get(sku)
      const parts = bom.get(sku)
      if (parts) consumedCount += parts.length
      return {
        sku,
        name: product?.name ?? sku,
        imageUrl: product?.imageUuid ?? "",
        producible: producible.get(sku) ?? 0,
      }
    })
    .sort((a, b) => b.producible - a.producible)

  return {
    results,
    summary: {
      totalCabinets: results.reduce((sum, r) => sum + r.producible, 0),
      partsConsumed: consumedCount,
      partsRemaining: totalInitial - consumedCount,
    },
  }
}
