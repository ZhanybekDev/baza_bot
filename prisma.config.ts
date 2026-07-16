import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma 7: connection URL для migrate/introspect живёт здесь (не в schema.prisma).
// Runtime-подключение идёт через @prisma/adapter-pg в server/db/client.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
