import type { Browser } from 'playwright'
import { extractTildaBlocks, newPage } from './browser.js'
import type { ParsedDoc } from '../types.js'
import type { Region } from '../../registry/projects.js'

const ORIGIN = 'https://realtors.baza.bz'
// Пауза между страницами: портал отдаёт 403 при быстрых запросах подряд (проверено).
const CRAWL_DELAY_MS = 1200
const MAX_PAGES = 40

export interface PortalPage {
  url: string
  region: Region
  doc: ParsedDoc
}

/**
 * Обходит дерево партнёрского портала от корней (/ekb, /msk) по внутренним ссылкам
 * и link=-атрибутам Tilda-таблиц. Дерево несимметрично (у /msk нет /svod) и меняется —
 * поэтому обход, а не фиксированный список URL.
 */
export async function crawlPortal(
  browser: Browser,
  roots: { url: string; region: Region }[],
): Promise<PortalPage[]> {
  const page = await newPage(browser)
  const pages: PortalPage[] = []
  try {
    for (const root of roots) {
      const rootPath = new URL(root.url).pathname
      const seen = new Set<string>()
      const queue = [rootPath]

      while (queue.length > 0 && pages.length < MAX_PAGES) {
        const path = queue.shift()
        if (!path || seen.has(path)) continue
        seen.add(path)

        const response = await page.goto(`${ORIGIN}${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        })
        await page.waitForTimeout(CRAWL_DELAY_MS)

        const status = response?.status() ?? 0
        if (status === 403) {
          throw new Error(`Portal throttled (403) at ${path} — increase CRAWL_DELAY_MS`)
        }
        if (status !== 200) continue

        const blocks = await extractTildaBlocks(page)
        if (blocks.length > 0) {
          pages.push({
            url: `${ORIGIN}${path}`,
            region: root.region,
            doc: {
              title: `Портал ${root.region}: ${path}`,
              blocks: blocks.map((b) => ({ section: `портал ${path}`, text: b.text })),
            },
          })
        }

        for (const link of await collectInternalLinks(page, rootPath)) {
          if (!seen.has(link) && !queue.includes(link)) queue.push(link)
        }
      }
    }
    return pages
  } finally {
    await page.context().close()
  }
}

/** Внутренние ссылки текущего поддерева (href + link= из Tilda-таблиц). */
async function collectInternalLinks(
  page: import('playwright').Page,
  rootPath: string,
): Promise<string[]> {
  const raw = await page.evaluate(() => {
    const hrefs = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '')
    const tilda = (document.body.innerHTML.match(/link=(\/[^;"'\s]+)/g) || []).map((s) => s.slice(5))
    return [...hrefs, ...tilda]
  })

  const out = new Set<string>()
  for (const href of raw) {
    if (!href.startsWith('/')) continue
    const path = href.split('#')[0]?.split('?')[0]?.replace(/\/$/, '') ?? ''
    if (!path || path.endsWith('.xml')) continue
    // Только текущее поддерево (/ekb/* или /msk/*), включая сам корень.
    if (path === rootPath || path.startsWith(`${rootPath}/`)) out.add(path)
  }
  return [...out]
}
