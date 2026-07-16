import type { ParsedDoc } from '../types.js'

export interface ParseResult {
  doc: ParsedDoc
  /** Только для PDF — нужно детектору сканов (символов на страницу). */
  pageCount?: number
}
