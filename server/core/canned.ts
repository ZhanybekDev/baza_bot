import { PROJECTS, type ProjectDef, type Region } from '../registry/projects.js'
import { formatManager, formatBothManagers } from './managers.js'
import { partnerPage, MORTGAGE_GENERAL, CALL_CENTER, BROKER_BOT, DISCLAIMER } from './links.js'

// Проценты в источнике (партнёрский портал) записаны с запятой — «2,6%». Реестр
// хранит их как number, поэтому при выводе возвращаем запятую (hard-rule #15).
function pct(n: number): string {
  return `${String(n).replace('.', ',')}%`
}

function formatFee(p: ProjectDef): string {
  if (!p.fee) return 'уточните у менеджера'
  let s = pct(p.fee.base)
  if (p.fee.bonus) s += ` + ещё ${pct(p.fee.bonus)} на выбор (${p.fee.bonusRule})`
  return s
}

/** Агентское вознаграждение. По проекту — из реестра; без проекта — сводка по всем. */
export function feeAnswer(projects: ProjectDef[]): string {
  if (projects.length === 0) {
    const lines = PROJECTS.filter((p) => p.fee).map((p) => `• ${p.name}: ${formatFee(p)}`)
    return `Размер агентского вознаграждения зависит от ЖК:\n${lines.join('\n')}\n\n${DISCLAIMER}`
  }
  const lines = projects.map((p) => `${p.name}: ${formatFee(p)}`)
  return `${lines.join('\n')}\n\n${DISCLAIMER}`
}

export function mortgageAnswer(region: Region, hasNamedProject: boolean): string {
  const url = hasNamedProject ? partnerPage(region) : MORTGAGE_GENERAL
  return `Актуальные ипотечные программы по проектам BAZA доступны по ссылке: ${url}\n\n${DISCLAIMER}`
}

export function installmentAnswer(region: Region): string {
  return `Подробные условия рассрочки для партнёров — на специальной странице: ${partnerPage(region)}\n\n${DISCLAIMER}`
}

export function fixationAnswer(region: Region): string {
  return [
    `Зафиксировать клиента можно на партнёрской странице (кнопка «Закрепить клиента»): ${partnerPage(region)}`,
    `Или через партнёрский бот: ${BROKER_BOT}`,
    '',
    `По вопросам фиксации поможет ваш менеджер:`,
    formatManager(region),
  ].join('\n')
}

export function dealAnswer(): string {
  return `По вопросам сделки, оформления документов, электронной регистрации и брони — контакт-центр BAZA: ${CALL_CENTER}`
}

export function contactsAnswer(region: Region, hasNamedProject: boolean): string {
  if (hasNamedProject) return `Ваш партнёрский менеджер:\n${formatManager(region)}`
  return `Контакты партнёрских менеджеров:\n\n${formatBothManagers()}`
}

/** Агентские проекты: у них нет презентаций застройщика — это не пробел, а свойство. */
export function agencyAnswer(projects: ProjectDef[]): string {
  const names = projects.map((p) => p.name).join(', ')
  const first = projects[0]
  const fee = first?.fee?.base ?? 1
  const region = first?.region ?? 'EKB'
  return [
    `${names} — BAZA реализует как агентство недвижимости (не как застройщик), поэтому презентаций застройщика по ним нет.`,
    `Агентское вознаграждение — ${fee}%.`,
    `Подробности, бронирование и актуальные условия — через менеджера:`,
    formatManager(region),
    '',
    DISCLAIMER,
  ].join('\n')
}

export function baliAnswer(projects: ProjectDef[]): string {
  const names = projects.map((p) => p.name).join(', ')
  return [
    `${names} — проекты BAZA на Бали.`,
    `Я консультирую партнёров по российским ЖК (Екатеринбург и Москва); по зарубежным проектам обратитесь к менеджеру:`,
    formatManager('EKB'),
  ].join('\n')
}

/** Полный список проектов BAZA по группам — из реестра, чтобы не расходился с истиной. */
export function projectsListAnswer(): string {
  const dev = (region: Region) =>
    PROJECTS.filter((p) => p.kind === 'DEVELOPER' && p.region === region)
      .map((p) => p.name)
      .join(', ')
  const agency = PROJECTS.filter((p) => p.kind === 'AGENCY')
    .map((p) => p.name)
    .join(', ')
  return [
    'Проекты BAZA Development:',
    '',
    `Застройщик, Екатеринбург: ${dev('EKB')}.`,
    `Застройщик, Москва: ${dev('MSK')}.`,
    `Реализуем как агентство недвижимости: ${agency}.`,
    `Застройщик, Бали: ${dev('BALI')}.`,
  ].join('\n')
}

export function dontKnowAnswer(region: Region): string {
  return `Не нашёл точной информации по вашему вопросу в базе знаний. Чтобы не ввести вас в заблуждение — уточните у менеджера:\n${formatManager(region)}`
}
