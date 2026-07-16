/**
 * Скачать URL в память. Явная ошибка при не-2xx — молчаливой деградации нет.
 * Ретраи с backoff: большие файлы (Google export до 25 МБ) иногда рвут сокет.
 */
export async function downloadBytes(url: string, timeoutMs = 120_000, attempts = 3): Promise<Uint8Array> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeoutMs)
      if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText} for ${url}`)
      }
      return new Uint8Array(await res.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(1000 * attempt)
    }
  }
  throw new Error(`Download failed after ${attempts} attempts for ${url}: ${String(lastError)}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
