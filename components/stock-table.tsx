"use client"

import { Table, Empty } from "antd"
import type { StockItem } from "@/lib/types"

interface StockTableProps {
  items: StockItem[]
}

export function StockTable({ items }: StockTableProps) {
  if (items.length === 0) {
    return <Empty description="No stock items found." />
  }

  const columns = [
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "image",
      width: 116,
      render: (url: string, row: StockItem) =>
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
      render: (name: string) => <span style={{ fontSize: 13, wordBreak: "break-word" }}>{name}</span>,
    },
    {
      title: "Qty",
      dataIndex: "availableQty",
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
      dataSource={items}
      rowKey="sku"
      pagination={false}
      size="small"
      bordered
      scroll={{ y: 400 }}
    />
  )
}
