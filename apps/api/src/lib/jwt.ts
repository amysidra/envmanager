import { sign, verify as jwtVerify } from "hono/jwt"

const SECRET = process.env.JWT_SECRET!
const EXPIRES_IN = 60 * 60 * 24 * 7 // 7 days

export async function signToken(userId: string): Promise<string> {
  return sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + EXPIRES_IN }, SECRET)
}

export async function verifyToken(token: string): Promise<{ sub: string }> {
  const payload = await jwtVerify(token, SECRET, "HS256")
  return payload as { sub: string }
}
