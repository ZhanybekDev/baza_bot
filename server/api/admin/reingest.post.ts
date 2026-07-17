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

// RUNNING старше этого порога считаем «зависшим» (процесс убит, не пометив FAILED)
// и позволяем запустить новый прогон. Ingest headed-браузером с паузами против
// троттлинга длится минуты, но не полчаса.
const STALE_RUN_MS = 30 * 60 * 1000

type Reserved = { runId: string } | { blockedBy: string }

export default defineEventHandler(async () => {
  // Атомарно резервируем прогон: в одной Serializable-транзакции проверяем, что нет
  // активного RUNNING, и сразу создаём запись. Закрывает race «два клика → два ingest» —
  // статус RUNNING виден мгновенно, а не через секунды старта ingest-процесса.
  let reserved: Reserved
  try {
    reserved = await prisma.$transaction(
      async (tx): Promise<Reserved> => {
        const running = await tx.ingestRun.findFirst({ where: { status: 'RUNNING' }, orderBy: { startedAt: 'desc' } })
        if (running && Date.now() - running.startedAt.getTime() < STALE_RUN_MS) {
          return { blockedBy: running.id }
        }
        if (running) {
          await tx.ingestRun.update({ where: { id: running.id }, data: { status: 'FAILED', finishedAt: new Date() } })
        }
        const created = await tx.ingestRun.create({ data: { status: 'RUNNING' } })
        return { runId: created.id }
      },
      { isolationLevel: 'Serializable' },
    )
  } catch {
    // Serializable отклонил одну из одновременных транзакций — другой запрос уже стартует прогон.
    return { started: false, reason: 'ingest уже запускается' }
  }

  if ('blockedBy' in reserved) {
    return { started: false, reason: 'ingest уже выполняется', runId: reserved.blockedBy }
  }
  const { runId } = reserved

  const command = process.env.INGEST_COMMAND ?? DEFAULT_INGEST_COMMAND

  // shell: true — команда из доверенного env (не пользовательский ввод), может содержать
  // обёртку "xvfb-run -a …". detached: процесс переживает завершение HTTP-запроса.
  // INGEST_RUN_ID — run.ts переиспользует зарезервированную запись, а не создаёт вторую.
  const child = spawn(command, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, INGEST_RUN_ID: runId },
    shell: true,
  })

  // Если процесс не удалось породить — снимаем RUNNING, иначе он завис бы и блокировал прогоны.
  child.on('error', (err) => {
    console.error('reingest: не удалось запустить ingest:', err)
    prisma.ingestRun
      .update({ where: { id: runId }, data: { status: 'FAILED', finishedAt: new Date(), log: `spawn failed: ${String(err)}` } })
      .catch((e) => console.error('reingest: не удалось пометить прогон FAILED:', e))
  })
  child.unref()

  return { started: true, runId }
})
