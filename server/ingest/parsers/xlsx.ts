import ExcelJS from 'exceljs'
import type { ParseResult } from './types.js'
import type { Block } from '../types.js'

/**
 * XLSX: лист = раздел, строка = блок «заголовок: описание». Structure-aware —
 * несущее требование архитектуры (наивный чанкинг проваливал тест-кейс отделки).
 * Первая строка-заголовок таблицы (Заголовок|Описание) пропускается.
 */
export async function parseXlsx(bytes: Uint8Array, title: string): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(bytes as unknown as ArrayBuffer)

  const blocks: Block[] = []
  for (const ws of wb.worksheets) {
    const section = ws.name.trim()
    ws.eachRow((row) => {
      const cells = (row.values as unknown[])
        .filter((v) => v != null)
        .map((v) => String(cellText(v)).trim())
        .filter((s) => s.length > 0)
      if (cells.length < 2) return
      const head = cells[0] ?? ''
      if (head.toLowerCase() === 'заголовок') return
      const rest = cells.slice(1).join(' — ')
      // Не дублируем заголовок, если описание уже с него начинается.
      const text = rest.toLowerCase().startsWith(head.toLowerCase()) ? rest : `${head}: ${rest}`
      blocks.push({ section, text: text.replace(/\s+/g, ' ').trim() })
    })
  }

  return { doc: { title, blocks } }
}

function cellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object' && 'text' in value) return String((value as { text: unknown }).text)
  if (typeof value === 'object' && 'result' in value) return String((value as { result: unknown }).result)
  if (typeof value === 'object' && 'richText' in value) {
    return (value as { richText: { text: string }[] }).richText.map((r) => r.text).join('')
  }
  return String(value)
}
