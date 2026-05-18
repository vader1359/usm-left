"use client"

import { ConfigProvider, App as AntdApp } from "antd"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>USM Cabinet Planner</title>
      </head>
      <body style={{ margin: 0 }}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
            },
          }}
        >
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </body>
    </html>
  )
}
