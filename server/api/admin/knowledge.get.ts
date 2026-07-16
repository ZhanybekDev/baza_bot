import { prisma } from '../../db/client.js'
import { PROJECTS } from '../../registry/projects.js'

const PAGE_SIZE = 30

// Просмотр того, что лежит в базе знаний: чанки с фильтром по проекту и поиском.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const projectId = typeof query.projectId === 'string' && query.projectId ? query.projectId : undefined
  const search = typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined

  const where = {
    ...(projectId ? { projectId } : {}),
    ...(search ? { content: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [chunks, total] = await Promise.all([
    prisma.chunk.findMany({
      where,
      select: { id: true, section: true, content: true, projectId: true, sourcePriority: true },
      orderBy: [{ projectId: 'asc' }, { section: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.chunk.count({ where }),
  ])

  return {
    chunks,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    projects: PROJECTS.map((p) => ({ id: p.id, name: p.name })),
  }
})
