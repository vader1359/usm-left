import type { AmisProduct } from "./types"
import { getToken } from "./amis-auth"
import { writeFileSync } from "fs"
import { join } from "path"
import prebuiltProducts from "@/data/usm-products.json"

const API_BASE = process.env.AMIS_API_URL || "https://crmconnect.misa.vn/api/v2"
const APP_ID = process.env.AMIS_APP_ID || "nanohome"
const CACHE_PATH = join(process.cwd(), "data", "usm-products.json")

let cachedProducts: AmisProduct[] | null = null

function saveCache(products: AmisProduct[]) {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(products, null, 2))
  } catch {
    // read-only filesystem (Vercel) — ignore
  }
}

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

  const local = prebuiltProducts as AmisProduct[]
  if (local.length > 0) {
    // Incremental: fetch only pages newer than our cached data
    const cacheSkus = new Set(local.map((p: AmisProduct) => p.sku))
    const newProducts: AmisProduct[] = []
    let page = 0
    let stopFetching = false

    while (!stopFetching) {
      try {
        const items = await fetchPage(page)
        if (items.length === 0) break

        let foundExisting = false
        for (const item of items) {
          if (cacheSkus.has(item.sku)) {
            foundExisting = true
          } else {
            newProducts.push(item)
          }
        }

        if (foundExisting) {
          stopFetching = true
        }

        page++
        if (items.length < 100) break
      } catch {
        break
      }
    }

    if (newProducts.length > 0) {
      const merged = [...newProducts, ...local]
      saveCache(merged)
      cachedProducts = merged
      return merged
    }

    cachedProducts = local
    return local
  }

  // No prebuilt cache — limited API fetch
  const products: AmisProduct[] = []
  let page = 0
  const maxPages = 20

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
