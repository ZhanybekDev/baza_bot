import { defineEventHandler } from 'h3'
import { prisma } from '../../db/client.js'

// Источники базы знаний + статус последнего прогона ingest (для дашборда админки).
export default defineEventHandler(async () => {
  const [sources, lastRun, projectCount, chunkCount] = await Promise.all([
    prisma.source.findMany({
      select: {
        id: true,
        url: true,
        title: true,
        projectId: true,
        createdAt: true,
        _count: { select: { documents: true } },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.ingestRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.project.count(),
    prisma.chunk.count(),
  ])

  return {
    sources,
    lastRun,
    stats: { projectCount, chunkCount, sourceCount: sources.length },
  }
})
