"use client"

import { useRef, useState } from "react"
import { Upload } from "antd"
import type { UploadProps } from "antd"

interface FileUploadProps {
  label: string
  accept: string
  file: File | null
  onFile: (file: File) => void
}

export function FileUpload({ label, accept, file, onFile }: FileUploadProps) {
  const name = file?.name

  const props: UploadProps = {
    accept,
    maxCount: 1,
    showUploadList: false,
    beforeUpload: (f) => {
      onFile(f as unknown as File)
      return false
    },
  }

  return (
    <div>
      <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 14 }}>{label}</div>
      <Upload.Dragger {...props} style={{ padding: 16 }}>
        {name ? (
          <div style={{ color: "#16a34a" }}>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {(file!.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div style={{ color: "#888" }}>
            <p style={{ fontSize: 24, margin: "0 0 4px" }}>+</p>
            <p style={{ margin: 0 }}>Drop file or click to browse</p>
          </div>
        )}
      </Upload.Dragger>
    </div>
  )
}
