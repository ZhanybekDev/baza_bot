import { spawn } from 'node:child_process'
import { defineEventHandler } from 'h3'
import { prisma } from '../../db/client.js'

// Кнопка «переобновить»: запускает ingest отдельным процессом (не блокирует запрос).
// Прогресс отслеживается через IngestRun (polling на дашборде).
//
// Команда ingest конфигурируется через INGEST_COMMAND (12-factor):
//   локально / dev        → "pnpm ingest"               (chromium с реальным дисплеем macOS)
//   прод (admin-контейнер) → "xvfb-run -a pnpm ingest"   (headed chromium под xvfb: best.baza.bz и портал блокируют headless)
const DEFAULT_INGEST_COMMAND = 'pnpm ingest'

export default defineEventHandler(async () => {
  const running = await prisma.ingestRun.findFirst({ where: { status: 'RUNNING' } })
  if (running) {
    return { started: false, reason: 'ingest уже выполняется', runId: running.id }
  }

  const command = process.env.INGEST_COMMAND ?? DEFAULT_INGEST_COMMAND

  // shell: true — команда из доверенного env (не пользовательский ввод), может содержать
  // обёртку "xvfb-run -a …". detached: процесс переживает завершение HTTP-запроса.
  const child = spawn(command, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: process.env,
    shell: true,
  })
  child.unref()

  return { started: true }
})
