import OpenAI from 'openai'

const EMBED_MODEL = 'bge-m3'
export const EMBED_DIM = 1024
const BATCH_SIZE = 64

function client(): OpenAI {
  const apiKey = process.env.BOTHUB_API_KEY
  const baseURL = process.env.BOTHUB_BASE_URL
  if (!apiKey) throw new Error('BOTHUB_API_KEY is required but not set')
  if (!baseURL) throw new Error('BOTHUB_BASE_URL is required but not set')
  return new OpenAI({ apiKey, baseURL })
}

export interface EmbedResult {
  vectors: number[][]
  cost: number
}

/** Эмбеддинги bge-m3 (1024 dims) через bothub, батчами по 64. */
export async function embedTexts(texts: string[]): Promise<EmbedResult> {
  const openai = client()
  const vectors: number[][] = []
  let cost = 0

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch })
    for (const item of res.data) {
      if (item.embedding.length !== EMBED_DIM) {
        throw new Error(`Unexpected embedding dim ${item.embedding.length}, expected ${EMBED_DIM}`)
      }
      vectors.push(item.embedding)
    }
    const usage = res.usage as { cost?: number } | undefined
    if (usage?.cost) cost += usage.cost
  }

  if (vectors.length !== texts.length) {
    throw new Error(`Embedding count mismatch: got ${vectors.length}, expected ${texts.length}`)
  }
  return { vectors, cost }
}
