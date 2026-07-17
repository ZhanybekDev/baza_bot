import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../db/client.js'

const PAGE_SIZE = 20

// История диалогов с ботом: кто спросил, что ответил.
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)

  const [dialogs, total] = await Promise.all([
    prisma.dialog.findMany({
      select: {
        id: true,
        tgChatId: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: { id: true, role: true, kind: true, text: true, intent: true, projectIds: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.dialog.count(),
  ])

  // BigInt (tgChatId) не сериализуется в JSON — приводим к строке.
  const serialized = dialogs.map((d) => ({ ...d, tgChatId: d.tgChatId.toString() }))

  return { dialogs: serialized, total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) }
})
