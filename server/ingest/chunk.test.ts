import { describe, it, expect } from 'vitest'
import { buildChunks, embeddingText } from './chunk.js'
import type { Block } from './types.js'

const ctx = { projectId: 'alisa', projectName: 'ЖК «Алиса»', sourcePriority: 3 }

describe('buildChunks', () => {
  it('should_keep_short_block_as_single_chunk', () => {
    const blocks: Block[] = [{ section: 'Отделка', text: 'White Box: стены, стяжка' }]
    const chunks = buildChunks(blocks, ctx)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.section).toBe('Отделка')
    expect(chunks[0]?.projectId).toBe('alisa')
    expect(chunks[0]?.sourcePriority).toBe(3)
  })

  it('should_split_block_longer_than_max', () => {
    const long = 'а'.repeat(2500)
    const chunks = buildChunks([{ section: 'X', text: long }], ctx)
    expect(chunks.length).toBe(3) // 2500 / 900 -> 3 pieces
    expect(chunks.every((c) => c.content.length <= 900)).toBe(true)
  })

  it('should_drop_empty_blocks', () => {
    const chunks = buildChunks([{ section: 'X', text: '   ' }], ctx)
    expect(chunks).toHaveLength(0)
  })
})

describe('embeddingText', () => {
  it('should_prefix_with_project_and_section', () => {
    const [chunk] = buildChunks([{ section: 'Отделка', text: 'White Box' }], ctx)
    expect(embeddingText(chunk!, 'ЖК «Алиса»')).toBe('[ЖК «Алиса»] раздел «Отделка» :: White Box')
  })
})
