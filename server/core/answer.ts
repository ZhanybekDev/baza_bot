import { route, type Route } from './router.js'
import { retrieveByProjects, retrieveGlobal, type RetrievedChunk } from './retrieve.js'
import { chat } from './llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js'
import {
  feeAnswer,
  mortgageAnswer,
  installmentAnswer,
  fixationAnswer,
  dealAnswer,
  contactsAnswer,
  agencyAnswer,
  baliAnswer,
  dontKnowAnswer,
} from './canned.js'

// Косинусное расстояние выше порога → в базе нет релевантного → честное «не знаю».
const DISTANCE_THRESHOLD = 0.55

export interface AnswerResult {
  text: string
  intent: string | null
  projectIds: string[]
  usedLlm: boolean
}

export async function answer(question: string): Promise<AnswerResult> {
  const r = route(question)
  const projectIds = r.projects.map((p) => p.id)

  // 1. Интент имеет приоритет над проектом (canned / fee / manager).
  if (r.intent) {
    return resolveIntent(question, r, projectIds)
  }

  // 2. Проект назван — но интента нет: агентство / Бали / project-scoped RAG.
  if (r.hasNamedProject) {
    const bali = r.projects.filter((p) => p.region === 'BALI')
    if (bali.length > 0) {
      return { text: baliAnswer(bali), intent: null, projectIds, usedLlm: false }
    }
    const developer = r.projects.filter((p) => p.kind === 'DEVELOPER')
    const agency = r.projects.filter((p) => p.kind === 'AGENCY')
    if (developer.length === 0 && agency.length > 0) {
      return { text: agencyAnswer(agency), intent: null, projectIds, usedLlm: false }
    }
    const chunks = await retrieveByProjects(developer.map((p) => p.id), question)
    if (chunks.length === 0) {
      return { text: dontKnowAnswer(r.region), intent: null, projectIds, usedLlm: false }
    }
    return { text: await llmAnswer(question, chunks, developer.map((p) => p.name)), intent: null, projectIds, usedLlm: true }
  }

  // 3. Проект не назван — глобальный векторный поиск с порогом «не знаю».
  const chunks = await retrieveGlobal(question, 8)
  if (chunks.length === 0 || (chunks[0]?.distance ?? 1) > DISTANCE_THRESHOLD) {
    return { text: dontKnowAnswer(r.region), intent: null, projectIds: [], usedLlm: false }
  }
  return { text: await llmAnswer(question, chunks), intent: null, projectIds: [], usedLlm: true }
}

async function resolveIntent(question: string, r: Route, projectIds: string[]): Promise<AnswerResult> {
  const intent = r.intent
  if (!intent) throw new Error('resolveIntent called without intent')
  const base = { intent: intent.id, projectIds }

  switch (intent.id) {
    case 'commission':
      return { text: feeAnswer(r.projects), ...base, usedLlm: false }
    case 'mortgage':
      return { text: mortgageAnswer(r.region, r.hasNamedProject), ...base, usedLlm: false }
    case 'installment':
      return { text: installmentAnswer(r.region), ...base, usedLlm: false }
    case 'fixation':
      return { text: fixationAnswer(r.region), ...base, usedLlm: false }
    case 'deal':
      return { text: dealAnswer(), ...base, usedLlm: false }
    case 'contacts':
      return { text: contactsAnswer(r.region, r.hasNamedProject), ...base, usedLlm: false }
    case 'objections': {
      // Возражения — материал в базе (docx Бестселлера). RAG по вопросу.
      const chunks = r.hasNamedProject
        ? await retrieveByProjects(r.projects.map((p) => p.id), question)
        : await retrieveGlobal(question, 8)
      if (chunks.length === 0) return { text: dontKnowAnswer(r.region), ...base, usedLlm: false }
      return { text: await llmAnswer(question, chunks, r.projects.map((p) => p.name)), ...base, usedLlm: true }
    }
    default: {
      const exhaustive: never = intent.id
      throw new Error(`Unhandled intent: ${String(exhaustive)}`)
    }
  }
}

async function llmAnswer(question: string, chunks: RetrievedChunk[], projectNames: string[] = []): Promise<string> {
  return chat(SYSTEM_PROMPT, buildUserPrompt(question, chunks, projectNames))
}
