// Soniox STT (async v5) через REST. Прямой REST, а не SDK: флоу проверен живьём,
// и хендлер полностью под контролем.
//
// 🔴 Байты грузим через /v1/files (multipart), НЕ через audio_url: Telegram-ссылка
// на файл содержит токен бота — отдать её Soniox значит отдать бота.

import { PROJECTS } from '../registry/projects.js'

const API = 'https://api.soniox.com'
const MODEL = 'stt-async-v5'
const POLL_INTERVAL_MS = 800
const POLL_TIMEOUT_MS = 60_000

// Soniox v5 «context.terms» смещает распознавание к доменным именам. Без него STT
// перевирал имена ЖК («Алисе» → «Олесе»), из-за чего роутер терял проект.
// Термины берём из реестра (имена + алиасы) — не разъезжаются с истиной.
const DOMAIN_TERMS = [
  'BAZA Development',
  'ЖК',
  'White Box',
  'отделка',
  'рассрочка',
  'ипотека',
  'вознаграждение',
]
const STT_CONTEXT_TERMS = [
  ...new Set([...DOMAIN_TERMS, ...PROJECTS.flatMap((p) => [p.name, ...p.aliases])]),
]

function apiKey(): string {
  const key = process.env.SONIOX_API_KEY
  if (!key) throw new Error('SONIOX_API_KEY is required but not set')
  return key
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${apiKey()}` }
}

/** Транскрибирует OGG/Opus (формат голосовых Telegram) на русском. Возвращает текст. */
export async function transcribe(audio: Uint8Array, filename = 'voice.ogg'): Promise<string> {
  const fileId = await uploadFile(audio, filename)
  try {
    const transcriptionId = await createTranscription(fileId)
    await waitCompleted(transcriptionId)
    return await fetchTranscript(transcriptionId)
  } finally {
    // Чистим за собой — не копим файлы/задачи в аккаунте Soniox.
    await deleteQuietly(`/v1/files/${fileId}`)
  }
}

async function uploadFile(audio: Uint8Array, filename: string): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob([audio as unknown as BlobPart], { type: 'audio/ogg' }), filename)
  const res = await fetch(`${API}/v1/files`, { method: 'POST', headers: authHeaders(), body: form })
  if (!res.ok) throw new Error(`Soniox file upload failed: ${res.status} ${await res.text()}`)
  const { id } = (await res.json()) as { id: string }
  return id
}

async function createTranscription(fileId: string): Promise<string> {
  const res = await fetch(`${API}/v1/transcriptions`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      file_id: fileId,
      language_hints: ['ru'],
      context: {
        general: [
          { key: 'domain', value: 'недвижимость' },
          { key: 'topic', value: 'жилые комплексы застройщика BAZA Development' },
        ],
        terms: STT_CONTEXT_TERMS,
      },
    }),
  })
  if (!res.ok) throw new Error(`Soniox transcription create failed: ${res.status} ${await res.text()}`)
  const { id } = (await res.json()) as { id: string }
  return id
}

async function waitCompleted(transcriptionId: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const res = await fetch(`${API}/v1/transcriptions/${transcriptionId}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Soniox status check failed: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { status: string; error_type?: string; error_message?: string }
    // Ошибки асинхронные: битый вход возвращает queued, ошибка вылезает здесь.
    if (data.status === 'error') {
      throw new Error(`Soniox transcription error: ${data.error_type}: ${data.error_message}`)
    }
    if (data.status === 'completed') return
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error(`Soniox transcription timed out after ${POLL_TIMEOUT_MS}ms`)
}

async function fetchTranscript(transcriptionId: string): Promise<string> {
  const res = await fetch(`${API}/v1/transcriptions/${transcriptionId}/transcript`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Soniox transcript fetch failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { text?: string }
  const text = data.text?.trim()
  if (!text) throw new Error('Soniox returned empty transcript')
  return text
}

async function deleteQuietly(path: string): Promise<void> {
  try {
    await fetch(`${API}${path}`, { method: 'DELETE', headers: authHeaders() })
  } catch {
    // cleanup — не критично, не роняем ответ пользователю из-за неудачного удаления
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
