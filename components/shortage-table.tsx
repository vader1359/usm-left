"use client"

import { Table, Empty } from "antd"
import type { CabinetShortage } from "@/lib/types"

interface ShortageTableProps {
  shortages: CabinetShortage[]
}

export function ShortageTable({ shortages }: ShortageTableProps) {
  if (shortages.length === 0) {
    return <Empty description="No shortage data available." />
  }

  const columns = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "image",
      width: 116,
      render: (url: string, row: CabinetShortage) =>
        url ? (
          <img src={url} alt={row.cabinetName} style={{ width: 100, height: 100, objectFit: "contain" }} />
        ) : (
          <div style={{ width: 100, height: 100, background: "#f0f0f0" }} />
        ),
    },
    {
      title: "SKU",
      dataIndex: "cabinetSku",
      key: "sku",
      width: 180,
      render: (sku: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{sku}</span>,
    },
    {
      title: "Product Name",
      dataIndex: "cabinetName",
      key: "name",
      render: (name: string) => <span style={{ fontSize: 13, wordBreak: "break-word" }}>{name}</span>,
    },
    {
      title: "%",
      dataIndex: "completenessPct",
      key: "pct",
      width: 70,
      align: "center" as const,
      render: (pct: number) => {
        const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#dc2626"
        return <span style={{ fontWeight: 700, color, fontSize: 14 }}>{pct}%</span>
      },
    },
    {
      title: "Missing Parts",
      dataIndex: "missingPartsList",
      key: "missing",
      width: 420,
      render: (list: CabinetShortage["missingPartsList"]) => {
        if (list.length === 0) {
          return <span style={{ color: "#16a34a", fontWeight: 600 }}>Complete</span>
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {list.map((mp) => (
              <div key={mp.partSku} style={{ fontSize: 12, lineHeight: "18px" }}>
                <span style={{ fontFamily: "monospace", color: "#666" }}>{mp.partSku}</span>
                <span style={{ color: "#333" }}> &mdash; {mp.partName}</span>
                {": "}
                <span style={{ fontWeight: 700, color: "#dc2626" }}>{mp.missingQty}</span>
              </div>
            ))}
          </div>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={shortages}
      rowKey="cabinetSku"
      pagination={false}
      size="small"
      bordered
      scroll={{ y: 600 }}
    />
  )
}
