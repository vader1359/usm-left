"use client"

import { useState, useEffect } from "react"
import { MenuOutlined } from "@ant-design/icons"

interface PrioritySortProps {
  items: { sku: string; name: string }[]
  onChange: (priorities: string[]) => void
}

export function PrioritySort({ items, onChange }: PrioritySortProps) {
  const [ordered, setOrdered] = useState(items.map((i) => i.sku))
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => { setOrdered(items.map((i) => i.sku)) }, [items])
  useEffect(() => { onChange(ordered) }, [ordered, onChange])

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); return }
    const next = [...ordered]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setOrdered(next)
    setDragIdx(null)
  }

  if (items.length === 0) return null

  return (
    <div>
      <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
        Priority Order (drag to reorder)
      </div>
      <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #d9d9d9", borderRadius: 8, padding: 4 }}>
        {ordered.map((sku, idx) => {
          const item = items.find((i) => i.sku === sku)
          return (
            <div
              key={sku}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                border: "1px solid #f0f0f0",
                borderRadius: 6,
                marginBottom: 2,
                cursor: "grab",
                opacity: dragIdx === idx ? 0.4 : 1,
                background: "#fff",
              }}
            >
              <MenuOutlined style={{ color: "#bbb", fontSize: 14 }} />
              <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace", width: 22 }}>
                #{idx + 1}
              </span>
              <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item?.name ?? sku}
              </span>
              <span style={{ fontSize: 11, color: "#aaa", flexShrink: 0 }}>{sku}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
