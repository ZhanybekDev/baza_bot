import { unzipSync, strFromU8 } from 'fflate'
import { XMLParser } from 'fast-xml-parser'
import type { ParseResult } from './types.js'
import type { Block } from '../types.js'

const parser = new XMLParser({ ignoreAttributes: true, textNodeName: '#text' })

/** PPTX: слайд = блок. Текст из всех <a:t> ранов слайда, в порядке номеров слайдов. */
export function parsePptx(bytes: Uint8Array, title: string): ParseResult {
  const files = unzipSync(bytes)

  const slideEntries = Object.keys(files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNum(a) - slideNum(b))

  const blocks: Block[] = []
  for (const name of slideEntries) {
    const entry = files[name]
    if (!entry) continue
    const xml = strFromU8(entry)
    const texts = collectText(parser.parse(xml))
    const text = texts.join(' ').replace(/\s+/g, ' ').trim()
    if (text.length > 0) {
      blocks.push({ section: `слайд ${slideNum(name)}`, text })
    }
  }

  return { doc: { title, blocks } }
}

function slideNum(name: string): number {
  return Number(name.match(/slide(\d+)\.xml/)?.[1] ?? 0)
}

/** Рекурсивно собирает все текстовые узлы <a:t> (в parsed-объекте — ключ 'a:t'). */
function collectText(node: unknown): string[] {
  const out: string[] = []
  const visit = (n: unknown): void => {
    if (n == null) return
    if (typeof n === 'string' || typeof n === 'number') {
      out.push(String(n))
      return
    }
    if (Array.isArray(n)) {
      n.forEach(visit)
      return
    }
    if (typeof n === 'object') {
      for (const [key, value] of Object.entries(n)) {
        if (key === 'a:t') visit(value)
        else if (typeof value === 'object') visit(value)
      }
    }
  }
  visit(node)
  return out
}
