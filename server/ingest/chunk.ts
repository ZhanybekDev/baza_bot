import type { Block } from './types.js'

const MAX_CHUNK_CHARS = 900

export interface ChunkInput {
  projectId: string | null
  section: string
  content: string
  sourcePriority: number
}

export interface ChunkContext {
  projectId: string | null
  /** Имя проекта для контекстного префикса эмбеддинга (или «Общее»). */
  projectName: string
  sourcePriority: number
}

/**
 * Блоки → чанки. Длинные блоки режутся по границе MAX_CHUNK_CHARS.
 * Structure-aware: раздел сохраняется, для эмбеддинга добавляется контекст проекта
 * (см. embeddingText) — наивный чанкинг без контекста проваливал тест-кейс отделки.
 */
export function buildChunks(blocks: Block[], ctx: ChunkContext): ChunkInput[] {
  const chunks: ChunkInput[] = []
  for (const block of blocks) {
    for (const piece of splitLong(block.text)) {
      chunks.push({
        projectId: ctx.projectId,
        section: block.section,
        content: piece,
        sourcePriority: ctx.sourcePriority,
      })
    }
  }
  return chunks
}

/** Текст для эмбеддинга: контекст проекта + раздел + содержимое. */
export function embeddingText(chunk: ChunkInput, projectName: string): string {
  return `[${projectName}] раздел «${chunk.section}» :: ${chunk.content}`
}

function splitLong(text: string): string[] {
  const trimmed = text.trim()
  if (trimmed.length <= MAX_CHUNK_CHARS) return trimmed.length > 0 ? [trimmed] : []
  const pieces: string[] = []
  for (let i = 0; i < trimmed.length; i += MAX_CHUNK_CHARS) {
    pieces.push(trimmed.slice(i, i + MAX_CHUNK_CHARS))
  }
  return pieces
}
