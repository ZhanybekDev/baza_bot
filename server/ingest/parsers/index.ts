import type { ParseKind } from '../../registry/sources.js'
import type { ParsedDoc } from '../types.js'
import { parsePdf } from './pdf.js'
import { parseXlsx } from './xlsx.js'
import { parseDocx } from './docx.js'
import { parsePptx } from './pptx.js'

/** Минимум символов на страницу PDF — ниже считаем скан без текстового слоя. */
const MIN_CHARS_PER_PAGE = 40
/** Абсолютный минимум для не-PDF — иначе документ пуст/битый. */
const MIN_DOC_CHARS = 60

export interface ParsedResult {
  doc: ParsedDoc
  charCount: number
  /** true — скан/пустышка: помечается NEEDS_OCR, чанки не создаются (не молча). */
  needsOcr: boolean
}

export async function parseBinary(bytes: Uint8Array, kind: ParseKind, title: string): Promise<ParsedResult> {
  switch (kind) {
    case 'pdf': {
      const { doc, pageCount } = await parsePdf(bytes, title)
      const charCount = countChars(doc)
      const perPage = pageCount && pageCount > 0 ? charCount / pageCount : charCount
      return { doc, charCount, needsOcr: perPage < MIN_CHARS_PER_PAGE }
    }
    case 'xlsx': {
      const { doc } = await parseXlsx(bytes, title)
      const charCount = countChars(doc)
      return { doc, charCount, needsOcr: charCount < MIN_DOC_CHARS }
    }
    case 'docx': {
      const { doc } = await parseDocx(bytes, title)
      const charCount = countChars(doc)
      return { doc, charCount, needsOcr: charCount < MIN_DOC_CHARS }
    }
    case 'pptx': {
      const { doc } = parsePptx(bytes, title)
      const charCount = countChars(doc)
      return { doc, charCount, needsOcr: charCount < MIN_DOC_CHARS }
    }
    case 'html':
      throw new Error('html is fetched pre-parsed via Playwright, not parseBinary')
    default: {
      const exhaustive: never = kind
      throw new Error(`Unknown parse kind: ${String(exhaustive)}`)
    }
  }
}

export function countChars(doc: ParsedDoc): number {
  return doc.blocks.reduce((sum, b) => sum + b.text.length, 0)
}
