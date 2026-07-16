// Реестр источников базы знаний. Атрибуция проекта задаётся ЗДЕСЬ, а не угадывается
// из пути файла (прототип из-за этого потерял ЖК ДНК — уехал в Бестселлер).
//
// Три группы:
//   1. FIXED_SOURCES  — прямые URL (сайты, Google export, одиночные файлы Yandex Disk).
//   2. Yandex-папка    — обходится фетчером; имя файла → проект по FOLDER_FILE_PROJECTS.
//   3. Портал          — обход дерева realtors.baza.bz (см. fetchers/portal.ts).

export type FetchKind = 'site' | 'google_export' | 'yadisk_file'
export type ParseKind = 'html' | 'xlsx' | 'docx' | 'pptx' | 'pdf'

export interface FixedSource {
  url: string
  fetch: FetchKind
  parse: ParseKind
  /** null — общий источник (не про конкретный ЖК). */
  projectId: string | null
  title: string
  /** Приоритет источника при дедупликации/ранжировании: выше — важнее. */
  priority: number
}

// --- Группа 1: прямые источники (именные ссылки ТЗ + гуглдок «Возражения») ---
export const FIXED_SOURCES: FixedSource[] = [
  {
    url: 'https://best.baza.bz/',
    fetch: 'site',
    parse: 'html',
    projectId: 'bestseller',
    title: 'Сайт ЖК Бестселлер',
    priority: 2,
  },
  {
    url: 'https://alisa.baza.bz/',
    fetch: 'site',
    parse: 'html',
    projectId: 'alisa',
    title: 'Сайт ЖК Алиса',
    priority: 2,
  },
  {
    url: 'https://docs.google.com/document/d/1b586b5UHcqeJUzzKbUzb8piSQ7VHduACBIlucaQ3l_g/export?format=docx',
    fetch: 'google_export',
    parse: 'docx',
    projectId: 'bestseller',
    title: 'Инструменты продаж (Бестселлер)',
    priority: 3,
  },
  {
    url: 'https://docs.google.com/spreadsheets/d/1t53RKhr85N2_kUqPqSYbGZ28BRkuoF3TbEjzogdkvIo/export?format=xlsx',
    fetch: 'google_export',
    parse: 'xlsx',
    projectId: 'alisa',
    title: 'База знаний Алиса',
    priority: 3,
  },
  {
    url: 'https://disk.yandex.ru/i/lYNpAd5TxZ-_ew',
    fetch: 'yadisk_file',
    parse: 'pptx',
    projectId: 'bestseller',
    title: 'Умный дом и Умная квартира (Бестселлер)',
    priority: 2,
  },
  {
    url: 'https://disk.yandex.ru/i/MJTTlnq1pkbpGQ',
    fetch: 'yadisk_file',
    parse: 'pdf',
    projectId: 'bestseller',
    title: 'Общая презентация Бестселлер',
    priority: 2,
  },
  {
    url: 'https://docs.google.com/document/d/196vtYXO5aTcQt6TFQPTAQ7UhmBxQhaNDyPco0s8qiXs/export?format=docx',
    fetch: 'google_export',
    parse: 'docx',
    projectId: 'bestseller',
    title: 'Отработка возражений (Бестселлер, МСК)',
    priority: 3,
  },
]

// --- Группа 2: папка Yandex Disk «Все презентации проектов» ---
// Публичный ключ папки (ТЗ, раздел «Общее»).
export const YANDEX_FOLDER_PUBLIC_KEY = 'https://disk.yandex.ru/d/BXqSX-BtE_IT2g'

// Имя файла (NFC-нормализованное) → проект. null — общий (регламент партнёров).
// Файлы вне карты игнорируются с логом — молча ничего не тянем.
export const FOLDER_FILE_PROJECTS: Record<string, string | null> = {
  'презентация_алиса.pdf': 'alisa',
  'неочевидные бытовые хитрости.pdf': 'alisa',
  'продвинутые сценарии для умного дома.pdf': 'alisa',
  'сценарии для здоровья и личного развития.pdf': 'alisa',
  'сценарии для знаний и обучения.pdf': 'alisa',
  'сценарии для развлечений и игр.pdf': 'alisa',
  'презентация_дмд.pdf': 'dmd1',
  'презентация_дмд (2 очередь) (1).pdf': 'dmd2',
  'презентация_днк.pdf': 'dnk',
  'Каменные Палатки (для отправки).pdf': 'kamennye-palatki',
  'регламент_по_работе_с_партнерами_BAZA_.pdf': null,
  'Планировочный альбом_Бестселлер (1).pdf': 'bestseller',
  'Агентская презентация.pdf': 'bestseller',
  'БЕСТСЕЛЛЕР .pdf': 'bestseller',
}

// Явно пропускаемые файлы папки — с причиной (не молча).
export const FOLDER_FILE_SKIP: Record<string, string> = {
  'Презентация Бестселлер.pdf': 'дубль именной ссылки (Общая презентация) — дедуп по контенту',
  'Презентация_мобильная.pdf': 'скан без текстового слоя (32 симв / 33 стр)',
  'Инфраструктура_ДНК.pdf': 'скан без текстового слоя (5 симв / 6 стр)',
  'Отделка.pdf': 'почти скан (1250 симв / 26 стр)',
  'Origins RU — Прайм-оффер.pdf': 'Бали — out of scope',
  'Project Kedungu Базовый оффер.pdf': 'Бали — out of scope',
  'Каталог Baza Kedungu 20 мб.pdf': 'Бали — out of scope',
  'Каталог Origins 20 мб.pdf': 'Бали — out of scope',
}

export const FOLDER_SOURCE_PRIORITY = 2

// --- Группа 3: партнёрский портал (обход дерева) ---
// Комиссии, рассрочка, ипотека — источник истины (свежее таблицы тест-кейсов).
export const PORTAL_ROOTS = [
  { url: 'https://realtors.baza.bz/ekb', region: 'EKB' as const },
  { url: 'https://realtors.baza.bz/msk', region: 'MSK' as const },
]

export const PORTAL_SOURCE_PRIORITY = 4
