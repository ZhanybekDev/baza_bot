import { randomUUID } from 'node:crypto'
import pgvector from 'pgvector'
import { prisma } from '../db/client.js'
import { PROJECTS } from '../registry/projects.js'
import type { ChunkInput } from './chunk.js'

export { contentHash } from './hash.js'

/** Сид реестра проектов в БД. Идемпотентно — upsert по id. */
export async function seedProjects(): Promise<void> {
  for (const p of PROJECTS) {
    const data = {
      name: p.name,
      aliases: p.aliases,
      region: p.region,
      kind: p.kind,
      feeBase: p.fee?.base ?? null,
      feeBonus: p.fee?.bonus ?? null,
      feeBonusRule: p.fee?.bonusRule ?? null,
      feeSource: p.fee?.source ?? null,
    }
    await prisma.project.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data })
  }
}

export async function upsertSource(url: string, title: string, projectId: string | null): Promise<string> {
  const source = await prisma.source.upsert({
    where: { url },
    create: { url, title, projectId },
    update: { title, projectId },
  })
  return source.id
}

/**
 * Документ считается готовым (reusable), только если у него есть чанки ИЛИ он NEEDS_OCR.
 * OK-документ без чанков — битый (эмбеддинг упал на прошлом прогоне): пересоздать.
 */
export async function findCompleteDocument(hash: string): Promise<{ id: string } | null> {
  const doc = await prisma.document.findUnique({
    where: { contentHash: hash },
    select: { id: true, status: true, _count: { select: { chunks: true } } },
  })
  if (!doc) return null
  if (doc.status === 'NEEDS_OCR' || doc._count.chunks > 0) return { id: doc.id }
  return null
}

export interface DocumentData {
  sourceId: string
  projectId: string | null
  title: string
  rawText: string
  hash: string
  charCount: number
  status: 'OK' | 'NEEDS_OCR'
}

/**
 * Заменяет документы источника (удаляет все прежние источника + любой битый документ
 * с этим же hash → cascade чанки), создаёт новый.
 */
export async function replaceDocument(data: DocumentData): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await tx.document.deleteMany({
      where: { OR: [{ sourceId: data.sourceId }, { contentHash: data.hash }] },
    })
    const doc = await tx.document.create({
      data: {
        sourceId: data.sourceId,
        projectId: data.projectId,
        title: data.title,
        contentHash: data.hash,
        rawText: data.rawText,
        charCount: data.charCount,
        status: data.status,
      },
      select: { id: true },
    })
    return doc.id
  })
}

/** Вставка чанков с эмбеддингами. Vector идёт через raw — Prisma create не умеет vector. */
export async function insertChunks(
  documentId: string,
  chunks: ChunkInput[],
  vectors: number[][],
): Promise<void> {
  if (chunks.length !== vectors.length) {
    throw new Error(`Chunk/vector count mismatch: ${chunks.length} vs ${vectors.length}`)
  }
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const vector = vectors[i]
    if (!chunk || !vector) throw new Error(`Missing chunk or vector at index ${i}`)
    const sql = pgvector.toSql(vector)
    await prisma.$executeRaw`
      INSERT INTO "Chunk" (id, "documentId", "projectId", section, content, "sourcePriority", embedding, "createdAt")
      VALUES (${randomUUID()}, ${documentId}, ${chunk.projectId}, ${chunk.section}, ${chunk.content}, ${chunk.sourcePriority}, ${sql}::vector, now())
    `
  }
}
