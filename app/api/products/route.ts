import { getToken } from "@/lib/amis-auth"
import { fetchAmisProducts } from "@/lib/amis-products"

export async function GET() {
  try {
    const token = await getToken()
    const products = await fetchAmisProducts()
    return Response.json({ success: true, token: token.slice(0, 10) + "...", count: products.length, products })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
