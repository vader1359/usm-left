"use client"

import { Table, Empty } from "antd"
import type { CabinetResult } from "@/lib/types"

interface ResultTableProps {
  results: CabinetResult[]
}

export function ResultTable({ results }: ResultTableProps) {
  if (results.length === 0) {
    return <Empty description="No cabinets can be produced with current stock." />
  }

  const columns = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "image",
      width: 116,
      render: (url: string, row: CabinetResult) =>
        url ? (
          <img src={url} alt={row.name} style={{ width: 100, height: 100, objectFit: "contain" }} />
        ) : (
          <div style={{ width: 100, height: 100, background: "#f0f0f0" }} />
        ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 180,
      render: (sku: string) => <span style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{sku}</span>,
    },
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name: string) => <span style={{ fontSize: 13 }}>{name}</span>,
    },
    {
      title: "Qty",
      dataIndex: "producible",
      key: "qty",
      width: 80,
      align: "center" as const,
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>{qty}</span>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={results}
      rowKey="sku"
      pagination={false}
      size="small"
      bordered
      scroll={{ y: 600 }}
    />
  )
}
