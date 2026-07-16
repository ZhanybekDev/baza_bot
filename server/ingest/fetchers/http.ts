/** Скачать URL в память. Явная ошибка при не-2xx — молчаливой деградации нет. */
export async function downloadBytes(url: string, timeoutMs = 60_000): Promise<Uint8Array> {
  const res = await fetchWithTimeout(url, timeoutMs)
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText} for ${url}`)
  }
  return new Uint8Array(await res.arrayBuffer())
}

export async function fetchJson<T>(url: string, timeoutMs = 30_000): Promise<T> {
  const res = await fetchWithTimeout(url, timeoutMs)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} for ${url}`)
  }
  return (await res.json()) as T
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}
