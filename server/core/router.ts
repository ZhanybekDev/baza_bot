import { detectIntent, type IntentDef } from './intents.js'
import { matchProjects, type ProjectDef, type Region } from '../registry/projects.js'

export interface Route {
  /** canned-тема (вознаграждение/ипотека/…) или null. */
  intent: IntentDef | null
  /** упомянутые проекты (0..n; «милый дом» без очереди → обе очереди). */
  projects: ProjectDef[]
  /** регион для region-зависимых ответов: из проекта, иначе ЕКБ по умолчанию. */
  region: Region
  hasNamedProject: boolean
}

/**
 * Классифицирует вопрос: интент (canned-тема) + проекты + регион.
 * Ветвление ответа (интент > проект > глобальный поиск) — в answer.ts.
 */
export function route(text: string): Route {
  const intent = detectIntent(text)
  const projects = matchProjects(text)
  const region: Region = projects[0]?.region ?? 'EKB'
  return { intent, projects, region, hasNamedProject: projects.length > 0 }
}

export type { IntentDef, ProjectDef, Region }
