import { prisma } from '../db/client.js'
import type { AnswerResult } from '../core/answer.js'

export interface ExchangeMeta {
  chatId: number
  userId?: number
  username?: string
}

/** Пишет пару «вопрос агента → ответ бота» в историю (Dialog/Message). */
export async function recordExchange(
  meta: ExchangeMeta,
  question: string,
  result: AnswerResult,
  kind: 'TEXT' | 'VOICE' = 'TEXT',
  transcript?: string,
): Promise<void> {
  const dialog = await prisma.dialog.upsert({
    where: { tgChatId: BigInt(meta.chatId) },
    create: {
      tgChatId: BigInt(meta.chatId),
      tgUserId: meta.userId != null ? BigInt(meta.userId) : null,
      username: meta.username ?? null,
    },
    update: { tgUserId: meta.userId != null ? BigInt(meta.userId) : null, username: meta.username ?? null },
    select: { id: true },
  })

  await prisma.message.create({
    data: {
      dialogId: dialog.id,
      role: 'USER',
      kind,
      text: question,
      transcript: transcript ?? null,
      intent: result.intent,
      projectIds: result.projectIds,
    },
  })
  await prisma.message.create({
    data: { dialogId: dialog.id, role: 'ASSISTANT', kind: 'TEXT', text: result.text },
  })
}
