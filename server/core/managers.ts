import type { Region } from '../registry/projects.js'

export interface Manager {
  name: string
  phone: string
  telegram: string
  channel: string
  role: string
}

// Двое партнёрских менеджеров по регионам. Ветка «не знаю → менеджер» проходит через
// всю архитектуру — неверный регион = агент звонит не тому человеку.
// «Яна Крылосова» — как на официальной странице /ekb (не «Крылосовла» из таблицы, там опечатка).
const EKB_MANAGER: Manager = {
  name: 'Яна Крылосова',
  phone: '+7 900 197-44-33',
  telegram: '@yanakrylosovaaa',
  channel: '@bazadevelopmentekb',
  role: 'Лидер партнёрского направления, Екатеринбург',
}

const MSK_MANAGER: Manager = {
  name: 'Алёна Дружинина',
  phone: '+7 902 809-69-55',
  telegram: '@druzhinina_alena',
  channel: '@bazadevelopmentmsk',
  role: 'Лидер партнёрского направления BAZA, Москва',
}

/** Менеджер по региону. Для Бали (out of scope) — оба контакта общей карточкой. */
export function getManager(region: Region): Manager {
  return region === 'MSK' ? MSK_MANAGER : EKB_MANAGER
}

export function formatManager(region: Region): string {
  const m = getManager(region)
  return `${m.name} (${m.role})\nТелефон: ${m.phone}\nTelegram: ${m.telegram}\nПартнёрский канал: ${m.channel}`
}

export function formatBothManagers(): string {
  return [formatManager('EKB'), '', formatManager('MSK')].join('\n')
}
