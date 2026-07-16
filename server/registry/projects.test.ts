import { describe, it, expect } from 'vitest'
import { matchProjects, PROJECTS, getProject } from './projects.js'

describe('matchProjects', () => {
  const expectIds = (text: string, ids: string[]) => {
    expect(matchProjects(text).map((p) => p.id).sort()).toEqual([...ids].sort())
  }

  it('should_match_exact_alias', () => {
    expectIds('Расскажи про ЖК ДМД2?', ['dmd2'])
    expectIds('Расскажи про ЖК Сезоны', ['sezony'])
  })

  it('should_match_by_stem_when_case_declined', () => {
    // Русские падежи: «Алису», «Милом доме», «палаткам» — точный матч не сработал бы.
    expectIds('Какая рассрочка на Алису и какой там ПВ', ['alisa'])
    expectIds('какой процент КВ по Алисе', ['alisa'])
    expectIds('что по палаткам', ['kamennye-palatki'])
    expectIds('планировки Милого дома', ['dmd1', 'dmd2'])
  })

  it('should_return_both_stages_for_mily_dom_without_stage', () => {
    // Комиссии ДМД1 (2.5%) и ДМД2 (2.7%) разные — нельзя молча выбрать одну.
    expectIds('На какой срок можно взять рассрочку в Милом доме', ['dmd1', 'dmd2'])
    expectIds('расскажи про милый дом', ['dmd1', 'dmd2'])
  })

  it('should_pick_specific_stage_when_named', () => {
    expectIds('Сколько первоначалка на ДМД2', ['dmd2'])
    expectIds('ДМД 1 очередь', ['dmd1'])
  })

  it('should_match_typo_aliases_from_customer_reference', () => {
    expectIds('расскажи про бэст', ['bestseller'])
    expectIds('что там в бестселере', ['bestseller'])
  })

  it('should_match_bali_projects_for_honest_out_of_scope', () => {
    expectIds('origins бали', ['origins'])
    expectIds('что по кедунгу', ['kedungu'])
  })

  it('should_return_empty_when_no_project_named', () => {
    expectIds('как оформить сделку', [])
    expectIds('какие нужны документы', [])
  })

  it('should_not_false_match_on_unrelated_words', () => {
    // «мил» как основа не должна ловиться без «дом».
    expectIds('миллион рублей на квартиру', [])
  })
})

describe('registry integrity', () => {
  it('should_have_unique_ids', () => {
    const ids = PROJECTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should_have_fee_for_all_developer_ekb_and_msk_projects', () => {
    for (const p of PROJECTS.filter((x) => x.kind === 'DEVELOPER' && x.region !== 'BALI')) {
      expect(p.fee, `${p.id} must have fee`).not.toBeNull()
    }
  })

  it('should_expose_alisa_fee_as_structure_with_bonus', () => {
    const alisa = getProject('alisa')
    expect(alisa?.fee?.base).toBe(2.6)
    expect(alisa?.fee?.bonus).toBe(1)
    expect(alisa?.fee?.bonusRule).toBeTruthy()
  })
})
