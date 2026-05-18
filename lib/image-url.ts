const IMAGE_BASE =
  process.env.AMIS_IMAGE_BASE ||
  "https://amisapp.misa.vn/crm/g1/api/business/images"
const COMPANY_CODE = process.env.AMIS_COMPANY_CODE || "N0GHGMOT"

export function getImageUrl(uuid: string): string {
  if (!uuid) return ""
  const id = uuid.endsWith(".jpg") || uuid.endsWith(".png") ? uuid : `${uuid}.jpg`
  return `${IMAGE_BASE}?companycode=${COMPANY_CODE}&id=${id}&type=2&isTemp=false&mode=pad&w=100&h=100`
}
