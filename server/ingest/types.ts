import type { ParseKind } from '../registry/sources.js'

/** Смысловой блок документа: раздел (лист/страница/секция) + его текст. */
export interface Block {
  section: string
  text: string
}

/** Результат парсинга/фетчинга источника — заголовок + блоки. */
export interface ParsedDoc {
  title: string
  blocks: Block[]
}

/** Задание на загрузку одного источника. */
export interface FetchTask {
  url: string
  title: string
  parse: ParseKind
  projectId: string | null
  priority: number
}

/** Загруженный, но ещё не распарсенный бинарный источник (docx/xlsx/pptx/pdf). */
export interface FetchedBinary extends FetchTask {
  kind: 'binary'
  bytes: Uint8Array
}

/** Уже распарсенный источник (сайт/портал — HTML извлекается при фетче). */
export interface FetchedParsed extends FetchTask {
  kind: 'parsed'
  doc: ParsedDoc
}

export type Fetched = FetchedBinary | FetchedParsed
