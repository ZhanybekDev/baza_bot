import { createHash } from 'node:crypto'

/** sha256 сырого текста — идемпотентность ingest + дедуп одинакового контента. */
export function contentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}
