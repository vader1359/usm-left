const https = require("https")
const fs = require("fs")
const path = require("path")

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkZGF0YSI6Ik9NdVc2dytKL0o4dWN0ZUVwQ2x4dkYyZU9weUZKMnRYeVFUNGd1UHVqbXozcWhOSFdlMnJBWUZsNElpbjI0L1JQYzlldUg3N2Z6dktVRTBKSFU0V2RRMU1Vcko1RzA5SDdhUGFLV2NVM2VNL3ZkTC81M28yaHZ1NG1tWWFMM2kwQVlsKzNEcVhWL3RhK3NYTXJneTliUTQyVmsyYlhMYjNJVkdyMmE5SkxKemNBaC9oTGorRTdvZHZpNEVRZUNGNnVXbHNtdTVmSk02aUcvRURla3RETmtyZGlMQXVDeUtlWkt4M3RKZkhGVVN4MjRqSGR4TkF0eXp0WllISVJMNXpsM1VDK3ZUNWRQbDN4ODdTNEZ1VEg0YUdqM1F0ajdVdWJ2RUE4UStTRko2ZGRkZDlGSFJGUFdPOEVYSFppZDR1OUpsTEdxNHhzUytic2tWNERuR2Vndz09IiwiZXhwIjoxNzc5MTQ4OTYwLCJpc3MiOiJNSVNBIiwiYXVkIjoiQU1JU0NSTTIifQ.kmF6mgW-z0q3s_zqJEIi7n5b6nSLa3qOF96JDLpTP20"
const APP_ID = "nanohome"
const BASE = "https://crmconnect.misa.vn/api/v2/Products"
const PAGE_SIZE = 100
const CUTOFF_DATE = process.argv[2] || null
const OUTPUT = path.join(__dirname, "..", "data", "usm-products.json")

async function fetchPage(page) {
  const url = `${BASE}?page=${page}&pageSize=${PAGE_SIZE}&orderBy=modified_date&isDescending=true`
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Clientid: APP_ID,
      },
    }
    const req = https.request(opts, (res) => {
      let body = ""
      res.on("data", (chunk) => (body += chunk))
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`))
          return
        }
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on("error", reject)
    req.end()
  })
}

async function main() {
  const products = []
  let page = 0
  let totalFetched = 0
  let stoppedEarly = false

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })

  while (true) {
    try {
      const data = await fetchPage(page)
      const items = data.data || []
      if (items.length === 0) break

      totalFetched += items.length
      let usmInPage = 0
      let earliestMod = ""

      for (const item of items) {
        const code = item.product_code || ""
        if (code.startsWith("USM")) {
          products.push({
            sku: code,
            name: item.product_name || code,
            imageUuid: item.avatar || "",
            modifiedDate: item.modified_date || "",
          })
          usmInPage++
        }
        earliestMod = item.modified_date || earliestMod
      }

      console.log(
        `Page ${page}: ${items.length} items, ${usmInPage} USM (total USM: ${products.length}, fetched: ${totalFetched})`
      )

      // Stop if earliest item in page is before cutoff (only when cutoff provided)
      if (CUTOFF_DATE && earliestMod && earliestMod < CUTOFF_DATE) {
        console.log(`Hit cutoff date (${earliestMod} < ${CUTOFF_DATE}), stopping.`)
        stoppedEarly = true
        break
      }

      page++
      if (items.length < PAGE_SIZE) break

      // Save intermediate every 50 pages
      if (page % 50 === 0) {
        fs.writeFileSync(OUTPUT, JSON.stringify(products, null, 2))
        console.log(`  -> intermediate save: ${products.length} products`)
      }
    } catch (err) {
      console.error(`Page ${page} error: ${err.message}`)
      // Retry once
      try {
        await new Promise((r) => setTimeout(r, 2000))
        const data = await fetchPage(page)
        const items = data.data || []
        // ... same logic
        totalFetched += items.length
        for (const item of items) {
          const code = item.product_code || ""
          if (code.startsWith("USM")) {
            products.push({
              sku: code,
              name: item.product_name || code,
              imageUuid: item.avatar || "",
              modifiedDate: item.modified_date || "",
            })
          }
        }
        page++
      } catch (e2) {
        console.error(`Retry failed, skipping page ${page}`)
        page++
      }
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(products, null, 2))
  console.log(`\nDone: ${products.length} USM products saved to ${OUTPUT}`)
  if (stoppedEarly) console.log("(Stopped early at cutoff date)")
}

main().catch(console.error)
