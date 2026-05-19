"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, Button, App } from "antd"
import { FileUpload } from "@/components/file-upload"
import { ModeToggle } from "@/components/mode-toggle"
import { PrioritySort } from "@/components/priority-sort"
import { ResultTable } from "@/components/result-table"
import { StockTable } from "@/components/stock-table"
import { ShortageTable } from "@/components/shortage-table"
import type { Mode, CabinetResult, StockItem, CabinetShortage } from "@/lib/types"

interface Summary {
  totalCabinets: number
  partsConsumed: number
  partsRemaining: number
}

interface ApiResult {
  success: boolean
  results: CabinetResult[]
  summary: Summary
  stockItems?: StockItem[]
  componentItems?: StockItem[]
  shortages?: CabinetShortage[]
  error?: string
}

export default function Home() {
  const [assemblyFile, setAssemblyFile] = useState<File | null>(null)
  const [stockFile, setStockFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>("independent")
  const [priorities, setPriorities] = useState<string[]>([])
  const [cabinetList, setCabinetList] = useState<{ sku: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CabinetResult[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [componentItems, setComponentItems] = useState<StockItem[]>([])
  const [shortages, setShortages] = useState<CabinetShortage[]>([])

  const { message } = App.useApp()

  useEffect(() => {
    async function loadDefaults() {
      try {
        const asmRes = await fetch("/assembly.xlsx")
        if (asmRes.ok) {
          const blob = await asmRes.blob()
          setAssemblyFile(
            new File([blob], "assembly.xlsx", {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
          )
        }
      } catch { /* ignore */ }
      try {
        const stkRes = await fetch("/stock.xlsx")
        if (stkRes.ok) {
          const blob = await stkRes.blob()
          setStockFile(
            new File([blob], "stock.xlsx", {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
          )
        }
      } catch { /* ignore */ }
    }
    loadDefaults()
  }, [])

  const handleCalculate = useCallback(async () => {
    if (!assemblyFile || !stockFile) {
      message.warning("Please upload both assembly and stock files")
      return
    }
    setLoading(true)
    setResults(null)
    setSummary(null)
    try {
      const formData = new FormData()
      formData.append("assembly", assemblyFile)
      formData.append("stock", stockFile)
      formData.append("mode", mode)
      if (mode === "prioritized" && priorities.length > 0) {
        formData.append("priorities", JSON.stringify(priorities))
      }
      const res = await fetch("/api/calculate", { method: "POST", body: formData })
      const data: ApiResult = await res.json()
      if (data.success && data.results) {
        setResults(data.results)
        setSummary(data.summary)
        setStockItems(data.stockItems ?? [])
        setComponentItems(data.componentItems ?? [])
        setShortages(data.shortages ?? [])
        setCabinetList(data.results.map((r) => ({ sku: r.sku, name: r.name })))
        message.success(
          `Calculated: ${data.summary.totalCabinets} cabinets across ${data.results.length} types`,
        )
      } else {
        message.error(data.error || "Calculation failed")
      }
    } catch {
      message.error("Network error during calculation")
    } finally {
      setLoading(false)
    }
  }, [assemblyFile, stockFile, mode, priorities, message])

  useEffect(() => {
    if (assemblyFile && stockFile) {
      handleCalculate()
    }
  }, [mode, priorities])

  const canCalculate = assemblyFile && stockFile

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>USM Cabinet Planner</h1>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
          Calculate how many USM cabinets can be assembled from leftover inventory
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>

        <Card title="Step 1: Upload Files" size="small">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FileUpload label="Assembly File (.xlsx)" accept=".xlsx" file={assemblyFile} onFile={setAssemblyFile} />
            <FileUpload label="Stock File (.xlsx)" accept=".xlsx" file={stockFile} onFile={setStockFile} />
          </div>
        </Card>

        <Card title="Step 2: Choose Mode" size="small">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ModeToggle mode={mode} onChange={setMode} />
            {mode === "prioritized" && cabinetList.length > 0 && (
              <PrioritySort items={cabinetList} onChange={setPriorities} />
            )}
          </div>
        </Card>

        <Card title="Step 3: Calculate" size="small">
          <Button
            type="primary"
            size="large"
            onClick={handleCalculate}
            disabled={!canCalculate}
            loading={loading}
          >
            Calculate
          </Button>
          {(!assemblyFile || !stockFile) && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#f59e0b" }}>
              Upload both files first.
            </p>
          )}
        </Card>

        {results && (
          <Card
            title={
              <span>
                Results
                {summary && (
                  <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: "#888" }}>
                    {summary.totalCabinets} cabinets across {results.length} types
                  </span>
                )}
              </span>
            }
            size="small"
          >
            <ResultTable results={results} />
          </Card>
        )}

        {shortages.length > 0 && (
          <Card
            title={
              <span>
                Thiếu linh kiện
                <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: "#888" }}>
                  {shortages.length} cabinets &middot; sorted by fewest missing parts
                </span>
              </span>
            }
            size="small"
          >
            <ShortageTable shortages={shortages} />
          </Card>
        )}

        {stockItems.length > 0 && (
          <Card
            title={
              <span>
                Stock
                <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: "#888" }}>
                  {stockItems.length} types
                </span>
              </span>
            }
            size="small"
          >
            <StockTable items={stockItems} />
          </Card>
        )}

        {componentItems.length > 0 && (
          <Card
            title={
              <span>
                Linh kiện
                <span style={{ marginLeft: 12, fontWeight: 400, fontSize: 13, color: "#888" }}>
                  {componentItems.length} types
                </span>
              </span>
            }
            size="small"
          >
            <StockTable items={componentItems} />
          </Card>
        )}
      </div>
    </div>
  )
}
