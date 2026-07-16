import OpenAI from 'openai'

const CHAT_MODEL = 'gpt-4.1-nano'

function client(): OpenAI {
  const apiKey = process.env.BOTHUB_API_KEY
  const baseURL = process.env.BOTHUB_BASE_URL
  if (!apiKey) throw new Error('BOTHUB_API_KEY is required but not set')
  if (!baseURL) throw new Error('BOTHUB_BASE_URL is required but not set')
  return new OpenAI({ apiKey, baseURL })
}

export async function chat(system: string, user: string, maxTokens = 500): Promise<string> {
  const res = await client().chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0,
    max_tokens: maxTokens,
  })
  const content = res.choices[0]?.message?.content
  if (!content) throw new Error('LLM returned empty response')
  return content.trim()
}
