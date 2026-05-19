export interface AmisProduct {
  sku: string
  name: string
  imageUuid: string
}

export interface BomRow {
  cabinetSku: string
  partSku: string
  qty: number
}

export interface StockRow {
  sku: string
  name: string
  imageUuid: string
  availableQty: number
}

export interface CabinetResult {
  sku: string
  name: string
  imageUrl: string
  producible: number
}

export type BOM = Map<string, { partSku: string; qty: number }[]>
export type Stock = Map<string, number>
export type ProductMap = Map<string, { name: string; imageUuid: string }>
export type Mode = "maximize" | "prioritized" | "independent" | "small-first" | "large-first"

export interface CalculateRequest {
  assemblyData: BomRow[]
  stockData: StockRow[]
  mode: Mode
  priorities?: string[]
}

export interface StockItem {
  sku: string
  name: string
  imageUrl: string
  availableQty: number
}

export interface MissingPart {
  partSku: string
  partName: string
  partImageUrl: string
  requiredQty: number
  availableQty: number
  missingQty: number
}

export interface CabinetShortage {
  cabinetSku: string
  cabinetName: string
  imageUrl: string
  canBuildMore: number
  totalParts: number
  missingParts: number
  totalMissingQty: number
  completenessPct: number
  missingPartsList: MissingPart[]
}

export interface CalculateResponse {
  results: CabinetResult[]
  summary: {
    totalCabinets: number
    partsConsumed: number
    partsRemaining: number
  }
  stockItems?: StockItem[]
  componentItems?: StockItem[]
  shortages?: CabinetShortage[]
}
