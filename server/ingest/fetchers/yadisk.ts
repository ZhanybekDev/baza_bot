import { downloadBytes, fetchJson } from './http.js'

// Yandex Disk public API. Работает без авторизации по публичному ключу (ссылке).
const API = 'https://cloud-api.yandex.net/v1/disk/public/resources'

interface YaItem {
  type: 'file' | 'dir'
  name: string
  path: string
  size?: number
}

interface YaListing {
  name?: string
  _embedded?: { items: YaItem[] }
}

interface YaDownload {
  href: string
}

/** Один публичный файл (ссылка вида /i/...). Возвращает байты. */
export async function fetchYandexFile(publicKey: string): Promise<Uint8Array> {
  const url = `${API}/download?public_key=${encodeURIComponent(publicKey)}`
  const { href } = await fetchJson<YaDownload>(url)
  return downloadBytes(href)
}

export interface YaFolderFile {
  /** Имя файла, нормализованное в NFC (Yandex отдаёт NFD — «й» ломает матч по имени). */
  name: string
  path: string
  size: number
}

/** Рекурсивный обход публичной папки. Имена приводятся к NFC. */
export async function listYandexFolder(publicKey: string): Promise<YaFolderFile[]> {
  const files: YaFolderFile[] = []
  await walk(publicKey, undefined, files)
  return files
}

async function walk(publicKey: string, path: string | undefined, out: YaFolderFile[]): Promise<void> {
  const params = new URLSearchParams({ public_key: publicKey, limit: '200' })
  if (path) params.set('path', path)
  const listing = await fetchJson<YaListing>(`${API}?${params.toString()}`)
  const items = listing._embedded?.items ?? []
  for (const item of items) {
    if (item.type === 'dir') {
      await walk(publicKey, item.path, out)
    } else {
      out.push({
        name: item.name.normalize('NFC'),
        path: item.path,
        size: item.size ?? 0,
      })
    }
  }
}

/** Скачать конкретный файл папки по его path. */
export async function downloadYandexFolderFile(publicKey: string, path: string): Promise<Uint8Array> {
  const url = `${API}/download?public_key=${encodeURIComponent(publicKey)}&path=${encodeURIComponent(path)}`
  const { href } = await fetchJson<YaDownload>(url)
  return downloadBytes(href)
}
