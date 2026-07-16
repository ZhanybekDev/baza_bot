import type { Browser } from 'playwright'
import { extractTildaBlocks, isBotFaqtorBlocked, newPage } from './browser.js'
import type { ParsedDoc } from '../types.js'

/** Минимум символов на странице — ниже порога считаем, что попали на заглушку/пустышку. */
const MIN_SITE_CHARS = 2000

/** Загружает Tilda-сайт headed-браузером, извлекает смысловые блоки. */
export async function fetchSite(browser: Browser, url: string, title: string): Promise<ParsedDoc> {
  const page = await newPage(browser)
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

    if (isBotFaqtorBlocked(page.url())) {
      throw new Error(`Site blocked by BotFAQtor anti-bot: ${url} (redirected to ${page.url()})`)
    }

    const blocks = await extractTildaBlocks(page)
    const totalChars = blocks.reduce((sum, b) => sum + b.text.length, 0)
    if (totalChars < MIN_SITE_CHARS) {
      throw new Error(
        `Site returned too little text (${totalChars} chars < ${MIN_SITE_CHARS}) for ${url} — likely a stub or block page`,
      )
    }

    return {
      title,
      blocks: blocks.map((b) => ({ section: `сайт: блок ${b.id}`, text: b.text })),
    }
  } finally {
    await page.context().close()
  }
}
