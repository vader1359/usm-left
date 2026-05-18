import type { AmisProduct } from "./types"
import { getToken } from "./amis-auth"

const API_BASE = process.env.AMIS_API_URL || "https://crmconnect.misa.vn/api/v2"
const APP_ID = process.env.AMIS_APP_ID || "nanohome"

let cachedProducts: AmisProduct[] | null = null

async function fetchPage(page: number): Promise<AmisProduct[]> {
  const token = await getToken()
  const url = `${API_BASE}/Products?page=${page}&pageSize=100&orderBy=modified_date&isDescending=true`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Clientid: APP_ID,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AMIS page ${page} failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  const items = data.data || []
  const products: AmisProduct[] = []

  for (const item of items) {
    const code = item.product_code || ""
    if (code.startsWith("USM")) {
      products.push({
        sku: code,
        name: item.product_name || code,
        imageUuid: item.avatar || "",
      })
    }
  }

  return products
}

export async function fetchAmisProducts(): Promise<AmisProduct[]> {
  if (cachedProducts) return cachedProducts

  const products: AmisProduct[] = []
  let page = 0
  const maxPages = 10

  while (page < maxPages) {
    try {
      const items = await fetchPage(page)
      if (items.length === 0) break
      products.push(...items)
      page++
      if (items.length < 100) break
    } catch {
      break
    }
  }

  cachedProducts = products
  return products
}

export function clearProductCache() {
  cachedProducts = null
}
