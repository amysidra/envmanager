import crypto from "node:crypto"

const KEY_HEX = process.env.ENCRYPTION_KEY ?? ""

if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
}

const KEY = Buffer.from(KEY_HEX, "hex")

export function encrypt(plaintext: string): { encryptedContent: string; iv: string } {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    encryptedContent: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  }
}

export function decrypt(encryptedContent: string, iv: string): string {
  const combined = Buffer.from(encryptedContent, "base64")
  const authTag = combined.subarray(combined.length - 16)
  const ciphertext = combined.subarray(0, combined.length - 16)
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"))
  decipher.setAuthTag(authTag)
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8")
}
