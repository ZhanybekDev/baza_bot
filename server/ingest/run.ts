import 'dotenv/config'
import { prisma } from '../db/client.js'
import { getProject } from '../registry/projects.js'
import {
  FIXED_SOURCES,
  YANDEX_FOLDER_PUBLIC_KEY,
  FOLDER_FILE_PROJECTS,
  FOLDER_FILE_SKIP,
  FOLDER_SOURCE_PRIORITY,
  PORTAL_ROOTS,
  PORTAL_SOURCE_PRIORITY,
  type ParseKind,
} from '../registry/sources.js'
import { downloadBytes, sleep } from './fetchers/http.js'
import { fetchYandexFile, listYandexFolder, downloadYandexFolderFile } from './fetchers/yadisk.js'
import { withBrowser } from './fetchers/browser.js'
import { fetchSite } from './fetchers/site.js'
import { crawlPortal } from './fetchers/portal.js'
import { parseBinary } from './parsers/index.js'
import { buildChunks, embeddingText } from './chunk.js'
import { embedTexts } from './embed.js'
import {
  contentHash,
  seedProjects,
  upsertSource,
  findCompleteDocument,
  replaceDocument,
  insertChunks,
} from './store.js'
import type { Block } from './types.js'

interface BinaryTask {
  url: string
  title: string
  parse: ParseKind
  projectId: string | null
  priority: number
  load: () => Promise<Uint8Array>
}

interface Counters {
  sourcesTotal: number
  sourcesOk: number
  sourcesFailed: number
  documentsNew: number
  documentsReused: number
  chunksTotal: number
  needsOcr: number
}

const logLines: string[] = []
function log(line: string): void {
  logLines.push(line)
  console.log(line)
}

async function main(): Promise<void> {
  // Запуск из админки (кнопка «переобновить») атомарно резервирует запись прогона и
  // передаёт её id — переиспользуем, чтобы не плодить вторую RUNNING. CLI-запуск
  // (`pnpm ingest` вручную) переменной не имеет — создаёт свою.
  const preId = process.env.INGEST_RUN_ID
  const run = preId
    ? await prisma.ingestRun.findUniqueOrThrow({ where: { id: preId } })
    : await prisma.ingestRun.create({ data: { status: 'RUNNING' } })
  const c: Counters = {
    sourcesTotal: 0,
    sourcesOk: 0,
    sourcesFailed: 0,
    documentsNew: 0,
    documentsReused: 0,
    chunksTotal: 0,
    needsOcr: 0,
  }

  try {
    log('→ Сид реестра проектов')
    await seedProjects()

    const binaryTasks = await collectBinaryTasks()
    log(`→ Бинарных источников: ${binaryTasks.length}`)
    for (const task of binaryTasks) {
      await runBinaryTask(task, c)
      // Google/Yandex троттлят частые скачивания — пауза между источниками.
      await sleep(800)
    }

    log('→ Браузерные источники (сайты + портал)')
    await withBrowser(async (browser) => {
      for (const src of FIXED_SOURCES.filter((s) => s.fetch === 'site')) {
        c.sourcesTotal++
        try {
          const doc = await fetchSite(browser, src.url, src.title)
          await ingestBlocks(src.url, src.title, src.projectId, src.priority, doc.blocks, 'OK', c)
          c.sourcesOk++
        } catch (error) {
          c.sourcesFailed++
          log(`  ✗ site ${src.url}: ${String(error)}`)
        }
      }

      const portalPages = await crawlPortal(browser, PORTAL_ROOTS)
      log(`  портал: ${portalPages.length} страниц`)
      for (const page of portalPages) {
        c.sourcesTotal++
        try {
          const title = `${page.doc.title}`
          await ingestBlocks(page.url, title, null, PORTAL_SOURCE_PRIORITY, page.doc.blocks, 'OK', c)
          c.sourcesOk++
        } catch (error) {
          c.sourcesFailed++
          log(`  ✗ portal ${page.url}: ${String(error)}`)
        }
      }
    })

    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { status: 'SUCCESS', finishedAt: new Date(), ...c, log: logLines.join('\n') },
    })
    log(
      `✓ Готово: источников ${c.sourcesOk}/${c.sourcesTotal}, документов новых ${c.documentsNew} / переиспользовано ${c.documentsReused}, чанков ${c.chunksTotal}, needs_ocr ${c.needsOcr}, ошибок ${c.sourcesFailed}`,
    )
  } catch (error) {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', finishedAt: new Date(), ...c, log: `${logLines.join('\n')}\nFATAL: ${String(error)}` },
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function collectBinaryTasks(): Promise<BinaryTask[]> {
  const tasks: BinaryTask[] = []

  for (const src of FIXED_SOURCES) {
    if (src.fetch === 'site') continue
    const url = src.url
    const load =
      src.fetch === 'yadisk_file'
        ? () => fetchYandexFile(url)
        : () => downloadBytes(url)
    tasks.push({ url, title: src.title, parse: src.parse, projectId: src.projectId, priority: src.priority, load })
  }

  const files = await listYandexFolder(YANDEX_FOLDER_PUBLIC_KEY)
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.pdf')) continue
    if (file.name in FOLDER_FILE_SKIP) {
      log(`  skip папка/${file.name}: ${FOLDER_FILE_SKIP[file.name]}`)
      continue
    }
    if (!(file.name in FOLDER_FILE_PROJECTS)) {
      log(`  ⚠ папка/${file.name}: нет в карте проектов — пропущен`)
      continue
    }
    const projectId = FOLDER_FILE_PROJECTS[file.name] ?? null
    const path = file.path
    tasks.push({
      url: `yadisk://${YANDEX_FOLDER_PUBLIC_KEY}${path}`,
      title: file.name,
      parse: 'pdf',
      projectId,
      priority: FOLDER_SOURCE_PRIORITY,
      load: () => downloadYandexFolderFile(YANDEX_FOLDER_PUBLIC_KEY, path),
    })
  }

  return tasks
}

async function runBinaryTask(task: BinaryTask, c: Counters): Promise<void> {
  c.sourcesTotal++
  try {
    const bytes = await task.load()
    const parsed = await parseBinary(bytes, task.parse, task.title)
    const status = parsed.needsOcr ? 'NEEDS_OCR' : 'OK'
    await ingestBlocks(task.url, task.title, task.projectId, task.priority, parsed.doc.blocks, status, c)
    c.sourcesOk++
  } catch (error) {
    c.sourcesFailed++
    log(`  ✗ ${task.title}: ${String(error)}`)
  }
}

async function ingestBlocks(
  url: string,
  title: string,
  projectId: string | null,
  priority: number,
  blocks: Block[],
  status: 'OK' | 'NEEDS_OCR',
  c: Counters,
): Promise<void> {
  const rawText = blocks.map((b) => `## ${b.section}\n${b.text}`).join('\n\n')
  const charCount = blocks.reduce((sum, b) => sum + b.text.length, 0)
  const hash = contentHash(rawText)
  const sourceId = await upsertSource(url, title, projectId)

  if (await findCompleteDocument(hash)) {
    c.documentsReused++
    log(`  = ${title}: без изменений (reused)`)
    return
  }

  const docId = await replaceDocument({ sourceId, projectId, title, rawText, hash, charCount, status })

  if (status === 'NEEDS_OCR') {
    c.needsOcr++
    log(`  ⚠ ${title}: скан без текста → NEEDS_OCR`)
    return
  }

  const projectName = (projectId && getProject(projectId)?.name) || 'Общее'
  const chunks = buildChunks(blocks, { projectId, projectName, sourcePriority: priority })
  const { vectors } = await embedTexts(chunks.map((ch) => embeddingText(ch, projectName)))
  await insertChunks(docId, chunks, vectors)

  c.documentsNew++
  c.chunksTotal += chunks.length
  log(`  + ${title}: ${chunks.length} чанков [${projectName}]`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
