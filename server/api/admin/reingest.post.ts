import { spawn } from 'node:child_process'
import { prisma } from '../../db/client.js'

// Кнопка «переобновить»: запускает ingest отдельным процессом (не блокирует запрос).
// Прогресс отслеживается через IngestRun (polling на дашборде).
export default defineEventHandler(async () => {
  const running = await prisma.ingestRun.findFirst({ where: { status: 'RUNNING' } })
  if (running) {
    return { started: false, reason: 'ingest уже выполняется', runId: running.id }
  }

  // detached: процесс переживает завершение HTTP-запроса.
  const child = spawn('pnpm', ['ingest'], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: process.env,
  })
  child.unref()

  return { started: true }
})
