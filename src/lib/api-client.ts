// Tiny fetch wrapper for the client
export async function fetcher<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      credentials: 'include',
    })
    const text = await res.text()
    if (!text) return null
    const data = JSON.parse(text)
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `Request failed: ${res.status}`
      throw new Error(typeof msg === 'string' ? msg : 'Request failed')
    }
    return data as T
  } catch (e: any) {
    if (e.name === 'SyntaxError') return null
    throw e
  }
}

export async function safeFetcher<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    return await fetcher<T>(url, init)
  } catch {
    return null
  }
}
