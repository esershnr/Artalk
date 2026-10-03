import { describe, expect, it } from 'vitest'
import { matchLocale, resolveForcedLocale } from './forced-locale'

const available = ['en', 'fr', 'tr', 'zh-CN', 'zh-TW']
const KEY = 'atk_sidebar_forced_locale'

function createStorage(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init))
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  } as unknown as Storage & { data: Map<string, string> }
}

describe('matchLocale', () => {
  it.each([
    ['tr', 'tr'],
    ['tr-TR', 'tr'],
    ['EN-us', 'en'],
    ['zh-tw', 'zh-TW'],
    ['zh_CN', 'zh-CN'],
    ['zh', ''],
    ['de', ''],
    ['auto', ''],
    ['', ''],
    ['../en', ''],
  ])('%j -> %j', (tag, expected) => {
    expect(matchLocale(tag, available)).toBe(expected)
  })
})

describe('resolveForcedLocale', () => {
  it('uses and keeps a known locale from the URL param', () => {
    const storage = createStorage()
    expect(resolveForcedLocale('tr-TR', available, storage)).toBe('tr')
    expect(storage.data.get(KEY)).toBe('tr')
  })

  it.each(['', 'auto', 'unknown'])('forces nothing and clears the kept locale for %j', (param) => {
    const storage = createStorage({ [KEY]: 'tr' })
    expect(resolveForcedLocale(param, available, storage)).toBe('')
    expect(storage.data.has(KEY)).toBe(false)
  })

  it('restores the kept locale after a reload', () => {
    expect(resolveForcedLocale(null, available, createStorage({ [KEY]: 'fr' }))).toBe('fr')
    expect(resolveForcedLocale(null, available, createStorage({ [KEY]: 'xx' }))).toBe('')
    expect(resolveForcedLocale(null, available, createStorage())).toBe('')
  })

  it('works without an accessible storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage

    expect(resolveForcedLocale('tr', available, blocked)).toBe('tr')
    expect(resolveForcedLocale(null, available, blocked)).toBe('')
    expect(resolveForcedLocale('tr', available, null)).toBe('tr')
  })
})
