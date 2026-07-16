import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

// Prisma 7 — driver adapter обязателен, url в конструктор через адаптер (не в schema).
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required but not set (checked: env, .env file)')
}

const adapter = new PrismaPg({ connectionString: databaseUrl })

export const prisma = new PrismaClient({ adapter })
