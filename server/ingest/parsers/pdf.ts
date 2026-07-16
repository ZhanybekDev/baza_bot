import { extractText, getDocumentProxy } from 'unpdf'
import type { ParseResult } from './types.js'

/** PDF: страница = блок. Возвращает pageCount для детектора сканов. */
export async function parsePdf(bytes: Uint8Array, title: string): Promise<ParseResult> {
  const pdf = await getDocumentProxy(bytes)
  const { totalPages, text } = await extractText(pdf, { mergePages: false })

  const blocks = text
    .map((pageText, i) => ({ section: `стр ${i + 1}`, text: normalize(pageText) }))
    .filter((b) => b.text.length > 0)

  return { doc: { title, blocks }, pageCount: totalPages }
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}
