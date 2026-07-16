import { Bot } from 'grammy'
import { answer } from '../core/answer.js'
import { transcribe } from '../core/stt.js'
import { downloadBytes } from '../ingest/fetchers/http.js'
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

  bot.on('message:voice', async (ctx) => {
    try {
      await ctx.replyWithChatAction('typing')
      // Скачиваем байты сами: Telegram-URL файла содержит токен бота, его нельзя отдавать Soniox.
      const file = await ctx.getFile()
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`
      const audio = await downloadBytes(fileUrl)
      const transcript = await transcribe(audio)

      const result = await answer(transcript)
      await ctx.reply(result.text)
      await recordExchange(
        { chatId: ctx.chat.id, userId: ctx.from?.id, username: ctx.from?.username },
        transcript,
        result,
        'VOICE',
        transcript,
      )
    } catch (error) {
      console.error('Failed to handle voice message:', error)
      await ctx.reply('Не удалось распознать голосовое сообщение. Попробуйте ещё раз или напишите текстом.')
    }
  })

  bot.catch((err) => {
    console.error('Bot error:', err.error)
  })

  return bot
}
