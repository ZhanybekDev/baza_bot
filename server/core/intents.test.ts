import { describe, it, expect } from 'vitest'
import { detectIntent } from './intents.js'

describe('detectIntent', () => {
  const expectIntent = (text: string, id: string | null) => {
    expect(detectIntent(text)?.id ?? null).toBe(id)
  }

  it('should_detect_commission_by_abbreviations', () => {
    // «КВ»/«АВ» — аббревиатуры, JS \b не работает с кириллицей.
    expectIntent('какой процент КВ по Алисе', 'commission')
    expectIntent('что такое АВ', 'commission')
    expectIntent('Сколько платите за клиента?', 'commission')
  })

  it('should_prioritize_installment_over_mortgage_when_both_present', () => {
    // «Сколько первоначалка на ДМД2» — рассрочка, не ипотека (обе имеют «ПВ»).
    expectIntent('Сколько первоначалка на ДМД2', 'installment')
    expectIntent('какой ПВ по рассрочке', 'installment')
  })

  it('should_detect_mortgage', () => {
    expectIntent('можно ли в ипотеку под 6%', 'mortgage')
    expectIntent('семейная ипотека условия', 'mortgage')
  })

  it('should_detect_fixation_not_deal_for_client_lock', () => {
    expectIntent('как зафиксировать клиента', 'fixation')
    expectIntent('как забронировать', 'fixation')
  })

  it('should_detect_deal', () => {
    expectIntent('какие нужны документы для сделки', 'deal')
    expectIntent('выход на сделку', 'deal')
  })

  it('should_detect_contacts_with_declined_phrasing', () => {
    expectIntent('кому могу позвонить узнать про сотрудничество', 'contacts')
    expectIntent('к кому обратиться из менеджеров', 'contacts')
  })

  it('should_detect_objections', () => {
    expectIntent('любые возражения клиента', 'objections')
  })

  it('should_detect_projects_list', () => {
    expectIntent('какие у вас проекты', 'projects')
    expectIntent('перечисли все ЖК', 'projects')
    expectIntent('список проектов BAZA', 'projects')
    expectIntent('что вы строите', 'projects')
  })

  it('should_not_treat_project_scoped_questions_as_projects_list', () => {
    // «расскажи про ЖК X» и «какая отделка в ЖК X» — контентные, не список.
    expectIntent('Какая отделка квартир в ЖК Алиса?', null)
    expectIntent('Расскажи про ЖК ДМД2?', null)
  })
})
