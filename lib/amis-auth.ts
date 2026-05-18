export async function getToken(): Promise<string> {
  const token = process.env.AMIS_BEARER_TOKEN
  if (!token) throw new Error("AMIS_BEARER_TOKEN not set in .env.local")
  return token
}
