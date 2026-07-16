import mammoth from 'mammoth'
import type { ParseResult } from './types.js'
import type { Block } from '../types.js'

/**
 * DOCX: таблицы → строка = блок «первая ячейка: остальные», абзацы вне таблиц → блоки.
 * Инструменты продаж — таблица (инструмент | условия | комментарий); возражения — текст.
 */
export async function parseDocx(bytes: Uint8Array, title: string): Promise<ParseResult> {
  const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) })
  const blocks: Block[] = []

  // Таблицы.
  for (const table of html.match(/<table[\s\S]*?<\/table>/gi) ?? []) {
    for (const row of table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = dedupeAdjacent(
        (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map((c) => stripTags(c)).filter(Boolean),
      )
      if (cells.length < 2) continue
      const head = cells[0] ?? ''
      blocks.push({
        section: `инструмент: ${head.slice(0, 60)}`,
        text: cells.join(' | '),
      })
    }
  }

  // Абзацы вне таблиц.
  const withoutTables = html.replace(/<table[\s\S]*?<\/table>/gi, '')
  for (const p of withoutTables.match(/<p[\s\S]*?<\/p>/gi) ?? []) {
    const text = stripTags(p)
    if (text.length >= 40) blocks.push({ section: 'текст', text })
  }

  return { doc: { title, blocks } }
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
}

/** Mammoth дублирует текст объединённых ячеек — схлопываем подряд идущие одинаковые. */
function dedupeAdjacent(cells: string[]): string[] {
  const out: string[] = []
  for (const c of cells) {
    if (out[out.length - 1] !== c) out.push(c)
  }
  return out
}
