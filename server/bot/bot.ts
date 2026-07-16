import { Bot } from 'grammy'
import { answer } from '../core/answer.js'
import { recordExchange } from './history.js'

const GREETING = `Здравствуйте! Я ассистент BAZA Development для партнёров.

Задайте вопрос по нашим ЖК — отделка, характеристики, вознаграждение, ипотека, рассрочка, фиксация клиента, контакты менеджера. Отвечу по базе знаний.`

export function createBot(token: string): Bot {
  const bot = new Bot(token)

  bot.command('start', async (ctx) => {
    await ctx.reply(GREETING)
  })

  bot.on('message:text', async (ctx) => {
    const question = ctx.message.text
    try {
      await ctx.replyWithChatAction('typing')
      const result = await answer(question)
      await ctx.reply(result.text)
      await recordExchange(
        { chatId: ctx.chat.id, userId: ctx.from?.id, username: ctx.from?.username },
        question,
        result,
      )
    } catch (error) {
      console.error(`Failed to answer "${question}":`, error)
      await ctx.reply('Извините, произошла ошибка. Попробуйте переформулировать вопрос или обратитесь к менеджеру.')
    }
  })

  bot.catch((err) => {
    console.error('Bot error:', err.error)
  })

  return bot
}
