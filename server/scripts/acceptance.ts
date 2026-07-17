import 'dotenv/config'
import { answer } from '../core/answer.js'
import { prisma } from '../db/client.js'

/**
 * Acceptance-прогон бота по ключевым тест-кейсам заказчика (аналог таблицы примеров).
 * Гоняет живой пайплайн `answer()` против наполненной БД и проверяет каждый ответ
 * на обязательные/запрещённые подстроки, интент, проект и дисклеймер.
 *
 * Запуск (нужны DATABASE_URL + BOTHUB_API_KEY в .env):
 *   pnpm tsx server/scripts/acceptance.ts
 */

interface Case {
  q: string
  must?: string[] // все подстроки должны присутствовать (регистронезависимо)
  mustNot?: string[] // ни одной из подстрок
  wantProject?: string // projectIds должен содержать
  note?: string
}

const CASES: Case[] = [
  { q: 'Перечисли варианты отделки в Алисе', must: ['white box', 'класси', 'урбан'], note: 'все варианты из базы, названия дословно' },
  { q: 'Какая отделка в Бестселлере', must: ['white box'], note: 'White Box + чистовая' },
  { q: 'Расскажи про ЖК ДМД2', must: ['31', '9', '20', '13'], mustNot: ['3,6', '3.6'], note: 'этажность; без выдуманной высоты потолков' },
  { q: 'Расскажи про ЖК Сезоны', must: ['агентств', '1%'], mustNot: ['не знаю', 'не располага'], note: 'агентство КВ 1%, не «не знаю»' },
  { q: 'какой процент КВ по Бестселлеру', must: ['2,1'], mustNot: ['спроси'], note: '2,1% (источник /msk)' },
  { q: 'какой процент КВ по Алисе', must: ['2,6', '1%'], mustNot: ['2,7'], note: '2,6% + 1% на выбор, не 2,7%' },
  { q: 'расскажи про бэст', wantProject: 'bestseller', note: 'роутер → Бестселлер' },
  { q: 'Какая рассрочка в Бестселлере', must: ['/msk'], mustNot: ['/ekb'], note: 'партнёрский портал /msk' },
  { q: 'как зафиксировать клиента', mustNot: ['(ссылка на этот раздел в аппке)'], note: 'ссылка на партнёрскую страницу, без плейсхолдера' },
  { q: 'Контакты менеджера в Екатеринбурге', must: ['крылосова'], mustNot: ['крылосовла'], note: 'Яна Крылосова (не «Крылосовла» из таблицы)' },
  { q: 'Какая погода сегодня в Москве', must: ['менеджер'], note: 'честное «не знаю» + менеджер' },
]

const DISCLAIMER = 'уточняйте в отделе продаж'
const FEE_INTENTS = new Set(['commission', 'mortgage', 'installment'])

const low = (s: string) => s.toLowerCase()

async function main(): Promise<void> {
  let pass = 0
  const failures: string[] = []

  for (const c of CASES) {
    const res = await answer(c.q)
    const t = low(res.text)
    const problems: string[] = []

    for (const m of c.must ?? []) if (!t.includes(low(m))) problems.push(`нет «${m}»`)
    for (const m of c.mustNot ?? []) if (t.includes(low(m))) problems.push(`есть запрещённое «${m}»`)
    if (c.wantProject && !res.projectIds.includes(c.wantProject)) {
      problems.push(`projectIds без ${c.wantProject} (${res.projectIds.join(',') || '—'})`)
    }
    if (res.intent && FEE_INTENTS.has(res.intent) && !t.includes(low(DISCLAIMER))) {
      problems.push('нет дисклеймера')
    }

    const ok = problems.length === 0
    if (ok) pass++
    else failures.push(c.q)

    console.log('\n' + '='.repeat(70))
    console.log(`${ok ? '✅ PASS' : '❌ FAIL'} | ${c.q}`)
    console.log(`intent=${res.intent ?? '—'} projects=[${res.projectIds.join(',')}] llm=${res.usedLlm} | ${c.note ?? ''}`)
    if (problems.length) console.log('  ПРОБЛЕМЫ: ' + problems.join('; '))
    console.log('  ОТВЕТ: ' + res.text.replace(/\n/g, '\n         '))
  }

  console.log('\n' + '#'.repeat(70))
  console.log(`ИТОГО: ${pass}/${CASES.length} PASS, ${CASES.length - pass} FAIL`)
  if (failures.length) console.log('Провалены: ' + failures.join(' | '))

  await prisma.$disconnect()
  process.exit(failures.length ? 1 : 0)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
