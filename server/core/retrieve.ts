import pgvector from 'pgvector'
import { prisma } from '../db/client.js'
import { embedTexts } from '../ingest/embed.js'

export interface RetrievedChunk {
  section: string
  content: string
  projectId: string | null
  /** Косинусное расстояние (0 — идентично). Только для глобального поиска. */
  distance?: number
}

/** Малый проект отдаём целиком, у большого берём vector top-k внутри него. */
const WHOLE_CORPUS_LIMIT = 60
const IN_PROJECT_TOP_K = 30

/**
 * Корпус проекта(ов) для named-проекта. Малый ЖК (≤60 чанков) отдаётся целиком —
 * обзорные вопросы «расскажи про ЖК» видят всё. Крупный (Алиса 207, Бестселлер 245)
 * сужается vector top-k внутри проекта по вопросу — иначе LLM тонет в объёме и на
 * «отделка» выхватывает не тот раздел.
 */
export async function retrieveByProjects(projectIds: string[], query?: string): Promise<RetrievedChunk[]> {
  const count = await prisma.chunk.count({ where: { projectId: { in: projectIds } } })

  if (count <= WHOLE_CORPUS_LIMIT || !query) {
    return prisma.chunk.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: [{ sourcePriority: 'desc' }, { createdAt: 'asc' }],
      select: { section: true, content: true, projectId: true },
    })
  }

  const { vectors } = await embedTexts([query])
  const vec = vectors[0]
  if (!vec) throw new Error('Failed to embed query')
  const sql = pgvector.toSql(vec)
  return prisma.$queryRaw<RetrievedChunk[]>`
    SELECT section, content, "projectId"
    FROM "Chunk"
    WHERE embedding IS NOT NULL AND "projectId" = ANY(${projectIds})
    ORDER BY embedding <=> ${sql}::vector, "sourcePriority" DESC
    LIMIT ${IN_PROJECT_TOP_K}
  `
}

/** pgvector top-k по косинусу — для вопросов без названного проекта. */
export async function retrieveGlobal(query: string, k = 8): Promise<RetrievedChunk[]> {
  const { vectors } = await embedTexts([query])
  const vec = vectors[0]
  if (!vec) throw new Error('Failed to embed query')
  const sql = pgvector.toSql(vec)
  return prisma.$queryRaw<RetrievedChunk[]>`
    SELECT section, content, "projectId", (embedding <=> ${sql}::vector) AS distance
    FROM "Chunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${sql}::vector
    LIMIT ${k}
  `
}
