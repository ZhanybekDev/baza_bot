// Реестр проектов BAZA Development — единственный источник истины об атрибуции,
// регионе и комиссии. Данные из справочника заказчика («Общая информация про проекты
// BAZA») и партнёрского портала realtors.baza.bz (комиссии — /ekb/svod и /msk).
//
// Проект НИКОГДА не угадывается из пути файла: источник → проект задаётся здесь и в
// registry/sources.ts. Ошибка атрибуции = неверный процент вознаграждения агенту.

export type Region = 'EKB' | 'MSK' | 'BALI'
export type ProjectKind = 'DEVELOPER' | 'AGENCY'

export interface ProjectFee {
  /** Базовая агентская комиссия, %. */
  base: number
  /** Дополнительный бонус на выбор, % (у Алисы — 1% себе или скидкой клиенту). */
  bonus?: number
  /** Правило применения бонуса — обязано звучать в ответе, иначе половина смысла теряется. */
  bonusRule?: string
  /** Откуда взята истина. */
  source: string
}

export interface ProjectDef {
  /** Slug — стабильный id в БД. */
  id: string
  name: string
  /** Регистронезависимые алиасы для роутинга. */
  aliases: string[]
  region: Region
  kind: ProjectKind
  /** У агентских и Бали комиссии из портала нет (null). */
  fee: ProjectFee | null
}

// Комиссии ЕКБ-застройщика — с /ekb/svod. Бонус 1% ("+1% на выбор") действует на всех
// застройщиков в своде через сноску **, но явная вилка 2,6%–3,6% указана только у Алисы,
// поэтому bonus фиксируем там, где заказчик его выделил.
const SVOD_BONUS_RULE =
  'дополнительно 1% от стоимости квартиры на выбор: либо в увеличение вознаграждения, либо в скидку клиенту — только один вариант'

export const PROJECTS: ProjectDef[] = [
  // --- Застройщик, Екатеринбург ---
  {
    id: 'alisa',
    name: 'ЖК «Алиса»',
    aliases: ['алиса', 'жк алиса', 'дом алиса'],
    region: 'EKB',
    kind: 'DEVELOPER',
    fee: { base: 2.6, bonus: 1, bonusRule: SVOD_BONUS_RULE, source: '/ekb/svod' },
  },
  {
    id: 'dmd1',
    name: 'ЖК «Милый дом», 1 очередь',
    aliases: ['милый дом 1 очередь', 'милый дом 1', 'дмд1', 'дмд 1'],
    region: 'EKB',
    kind: 'DEVELOPER',
    fee: { base: 2.5, source: '/ekb/svod' },
  },
  {
    id: 'dmd2',
    name: 'ЖК «Милый дом», 2 очередь',
    aliases: ['милый дом 2 очередь', 'милый дом 2', 'дмд2', 'дмд 2'],
    region: 'EKB',
    kind: 'DEVELOPER',
    fee: { base: 2.7, source: '/ekb/svod' },
  },
  {
    id: 'dnk',
    name: 'ЖК «ДНК: Дом на Куйбышева»',
    aliases: ['днк', 'дом на куйбышева'],
    region: 'EKB',
    kind: 'DEVELOPER',
    fee: { base: 3.5, source: '/ekb/svod' },
  },
  {
    id: 'kamennye-palatki',
    name: 'Квартал-парк «Каменные палатки»',
    aliases: ['каменные палатки', 'парк каменные палатки', 'палатки', 'пкп'],
    region: 'EKB',
    kind: 'DEVELOPER',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  // --- Застройщик, Москва ---
  {
    id: 'bestseller',
    name: 'ЖК «Бестселлер»',
    aliases: ['бестселлер', 'бестселер', 'бэстселлер', 'бэстселер', 'бест', 'бэст'],
    region: 'MSK',
    kind: 'DEVELOPER',
    fee: { base: 2.1, source: '/msk' },
  },
  // --- Агентство недвижимости (BAZA не строит — презентаций нет, это не пробел) ---
  {
    id: 'yuzhnye-kvartaly',
    name: 'ЖК «Южные Кварталы»',
    aliases: ['южные кварталы'],
    region: 'EKB',
    kind: 'AGENCY',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  {
    id: 'tyoplye-kvartaly',
    name: 'ЖК «Тёплые Кварталы»',
    aliases: ['тёплые кварталы', 'теплые кварталы'],
    region: 'EKB',
    kind: 'AGENCY',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  {
    id: 'moskovskiy-kvartal',
    name: 'Клубный дом «Московский Квартал»',
    aliases: ['московский квартал', 'московски квартал', 'мк'],
    region: 'EKB',
    kind: 'AGENCY',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  {
    id: 'river-park',
    name: 'ЖК «River Park»',
    aliases: ['river park', 'ривер парк'],
    region: 'EKB',
    kind: 'AGENCY',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  {
    id: 'sezony',
    name: 'ЖК «Сезоны»',
    aliases: ['сезоны'],
    region: 'EKB',
    kind: 'AGENCY',
    fee: { base: 1, source: 'таблица вознаграждений' },
  },
  // --- Застройщик, Бали (out of scope, но распознаём чтобы честно отвечать «вне области») ---
  {
    id: 'origins',
    name: 'Origins (Бали)',
    aliases: ['origins', 'ориджинс', 'оригинс', 'ориджин'],
    region: 'BALI',
    kind: 'DEVELOPER',
    fee: null,
  },
  {
    id: 'kedungu',
    name: 'Kedungu (Бали)',
    aliases: ['kedungu', 'кедунгу', 'кидунгу', 'кидунг'],
    region: 'BALI',
    kind: 'DEVELOPER',
    fee: null,
  },
]

const PROJECT_BY_ID = new Map(PROJECTS.map((p) => [p.id, p]))

export function getProject(id: string): ProjectDef | undefined {
  return PROJECT_BY_ID.get(id)
}

// Русские падежи ломают точный матч («Алису» ≠ «алиса», «Милом доме» ≠ «милый дом»).
// Матчим по основе: у слов длиннее 4 букв отрезаем короткое окончание и сравниваем
// как префикс. Короткие слова и аббревиатуры (мк, бест, днк, дом) — целиком, иначе
// «бест» поймает «бестолковый».
const RU_ENDING = /(ами|ах|ов|ом|ам|ой|ый|ий|ые|ю|я|у|ы|и|е|а|о)$/

function stem(word: string): string {
  const w = word.toLowerCase().replace(/ё/g, 'е')
  return w.length > 4 ? w.replace(RU_ENDING, '') : w
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z0-9]+/g) ?? [])
}

/** Все слова алиаса найдены в тексте (по основе / целиком для коротких). */
function aliasMatches(alias: string, tokens: string[], stems: string[]): boolean {
  const aliasWords = alias.split(/\s+/).filter(Boolean)
  return aliasWords.every((aw) => {
    if (aw.length <= 4) return tokens.includes(aw.toLowerCase().replace(/ё/g, 'е'))
    const base = stem(aw)
    return stems.some((s) => s.startsWith(base) || base.startsWith(s))
  })
}

// «Милый дом» / «ДМД» без указания очереди — обе очереди (JS \b не дружит с кириллицей,
// поэтому по токенам, а не regex). Роутер обязан вернуть обе, а не молча выбрать ДМД1:
// комиссии 2.5% vs 2.7% разные.
function isGenericDmd(tokens: string[], stems: string[]): boolean {
  const bareDmd = tokens.includes('дмд')
  const milyDom = stems.some((s) => s.startsWith('мил')) && tokens.some((t) => t.startsWith('дом'))
  return bareDmd || milyDom
}

/**
 * Находит проекты, упомянутые в тексте (регистронезависимо, по основам алиасов).
 * Обычно один проект, но «милый дом» без очереди → обе очереди.
 * Пусто — проект не назван; вызывающий уходит в общий поиск.
 */
export function matchProjects(text: string): ProjectDef[] {
  const tokens = tokenize(text)
  const stems = tokens.map(stem)
  const matched = new Map<string, ProjectDef>()

  for (const project of PROJECTS) {
    if (project.aliases.some((a) => aliasMatches(a, tokens, stems))) {
      matched.set(project.id, project)
    }
  }

  // «Милый дом» / «ДМД» без конкретной очереди → обе очереди.
  if (isGenericDmd(tokens, stems) && !matched.has('dmd1') && !matched.has('dmd2')) {
    const dmd1 = getProject('dmd1')
    const dmd2 = getProject('dmd2')
    if (dmd1) matched.set('dmd1', dmd1)
    if (dmd2) matched.set('dmd2', dmd2)
  }

  return [...matched.values()]
}
