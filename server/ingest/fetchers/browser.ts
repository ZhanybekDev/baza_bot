import { chromium, type Browser, type Page } from 'playwright'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/**
 * headed chromium — обязателен: best.baza.bz и партнёрский портал отдают headless
 * заглушку BotFAQtor (403 / страница «визит заблокирован»). Проверено: headless
 * блокируется, bundled chromium в headed проходит.
 */
export async function withBrowser<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

export async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  })
  return context.newPage()
}

export interface TildaBlock {
  id: string
  text: string
}

/**
 * Извлекает смысловые блоки Tilda-страницы. Критично удалить style/script ДО чтения
 * innerText — иначе innerText тащит инлайновый CSS (один блок = 72k символов CSS
 * вместо текста). Берём только верхнеуровневые .t-rec (вложенные дублируют родителя)
 * + дедуп повторяющихся блоков (меню/футер).
 */
export async function extractTildaBlocks(page: Page): Promise<TildaBlock[]> {
  // Догрузить lazy-блоки Tilda прокруткой.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 70))
    }
  })
  await page.waitForTimeout(1500)

  const blocks = await page.evaluate(() => {
    document.querySelectorAll('style, script, noscript').forEach((e) => e.remove())
    const all = Array.from(document.querySelectorAll<HTMLElement>('.t-rec'))
    const topLevel = all.filter((el) => !all.some((other) => other !== el && other.contains(el)))
    return topLevel
      .map((el) => ({ id: el.id || '', text: (el.innerText || '').replace(/\s+/g, ' ').trim() }))
      .filter((b) => b.text.length > 40)
  })

  const seen = new Set<string>()
  const unique: TildaBlock[] = []
  for (const b of blocks) {
    if (seen.has(b.text)) continue
    seen.add(b.text)
    unique.push(b)
  }
  return unique
}

export function isBotFaqtorBlocked(url: string): boolean {
  return url.includes('botfaqtor')
}
