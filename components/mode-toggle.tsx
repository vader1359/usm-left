"use client"

import { Segmented } from "antd"
import type { Mode } from "@/lib/types"

interface ModeToggleProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <Segmented
      value={mode}
      onChange={(val) => onChange(val as Mode)}
      options={[
        { label: "All Possible", value: "independent" },
        { label: "Maximize Total", value: "maximize" },
        { label: "Prioritized", value: "prioritized" },
      ]}
    />
  )
}
