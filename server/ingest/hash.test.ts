import { describe, it, expect } from 'vitest'
import { contentHash } from './hash.js'

describe('contentHash', () => {
  it('should_be_deterministic', () => {
    expect(contentHash('привет мир')).toBe(contentHash('привет мир'))
  })

  it('should_differ_for_different_content', () => {
    expect(contentHash('a')).not.toBe(contentHash('b'))
  })

  it('should_dedup_identical_content_from_two_sources', () => {
    // «Презентация Бестселлер» приходит из именной ссылки и из папки — один hash.
    const fromNamedLink = 'ПРЕЗЕНТАЦИЯ БЕСТСЕЛЛЕР текст...'
    const fromFolder = 'ПРЕЗЕНТАЦИЯ БЕСТСЕЛЛЕР текст...'
    expect(contentHash(fromNamedLink)).toBe(contentHash(fromFolder))
  })
})
