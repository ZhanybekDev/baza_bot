import type { Region } from '../registry/projects.js'

// Партнёрские страницы портала по региону — рассрочка/фиксация/финансовые инструменты.
// /ekb и /msk несимметричны, но обе живые (см. ingest портала).
const PARTNER_PAGE: Record<'EKB' | 'MSK', string> = {
  EKB: 'https://realtors.baza.bz/ekb',
  MSK: 'https://realtors.baza.bz/msk',
}

/** Партнёрская страница региона. Для Бали регион не покрыт — возвращаем ЕКБ как основной. */
export function partnerPage(region: Region): string {
  return region === 'MSK' ? PARTNER_PAGE.MSK : PARTNER_PAGE.EKB
}

/** Общая страница ипотечных программ (перечисляет и московские, и екатеринбургские проекты). */
export const MORTGAGE_GENERAL = 'https://baza.bz/sposobi-pokupki/ipoteka'

/** Контакт-центр — на вопросы про сделку/документы/бронь. */
export const CALL_CENTER = '305-05-05'

/** Референсный бот-мини-апп заказчика (фиксация клиента). */
export const BROKER_BOT = 'https://t.me/bazabz_broker_bot'

// Обязательный дисклеймер заказчика при любом ответе про условия (комиссия/ипотека/
// рассрочка/акции). Бот не публикует оферту от имени застройщика.
export const DISCLAIMER = 'Не оферта. Акции не суммируются. Точные условия уточняйте в отделе продаж.'
