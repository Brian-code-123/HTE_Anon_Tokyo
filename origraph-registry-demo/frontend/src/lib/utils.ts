export async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(text))
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function truncate(value: string, size = 12): string {
  if (value.length <= size * 2) {
    return value
  }
  return `${value.slice(0, size)}...${value.slice(-size)}`
}

export function toIsoOrDash(value?: string): string {
  return value ? new Date(value).toLocaleString() : '-'
}

export function normalizePrivateKey(input: string): string {
  let key = input.replace(/[\s\u200B-\u200D\uFEFF\u2060-\u2064]/g, '')
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    key = `0x${key}`
  }
  return key
}

export function isValidPrivateKey(key: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(key)
}
