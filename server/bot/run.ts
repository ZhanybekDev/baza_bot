import 'dotenv/config'
import { createBot } from './bot.js'
import { prisma } from '../db/client.js'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required but not set (checked: env, .env file)')
}

const bot = createBot(token)

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} — останавливаю бота...`)
  await bot.stop()
  await prisma.$disconnect()
  process.exit(0)
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

console.log('→ Запуск бота (long polling)...')
await bot.start({
  onStart: (info) => console.log(`✓ Бот @${info.username} запущен`),
})
