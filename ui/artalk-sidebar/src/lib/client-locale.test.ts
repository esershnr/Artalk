// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { availableLocales } from '../i18n'
import { clientLocaleLoaders, loadClientLocale } from './client-locale'

// `window.ArtalkI18n` is where the client looks up the external locale sets
const win = window as Window & { ArtalkI18n?: Record<string, Record<string, string>> }

afterEach(() => {
  delete win.ArtalkI18n
  vi.restoreAllMocks()
})

describe('clientLocaleLoaders', () => {
  it('lists only the locale sets which are not bundled into the client', () => {
    expect(Object.keys(clientLocaleLoaders)).toEqual(expect.arrayContaining(['tr', 'zh-TW']))
    expect(clientLocaleLoaders).not.toHaveProperty('en')
    expect(clientLocaleLoaders).not.toHaveProperty('zh-CN')
    expect(clientLocaleLoaders).not.toHaveProperty('index')
    expect(clientLocaleLoaders).not.toHaveProperty('external')
  })

  it('has a client locale set for every sidebar locale', () => {
    const bundled = ['en', 'zh-CN']
    const missing = availableLocales.filter((l) => !bundled.includes(l) && !clientLocaleLoaders[l])
    expect(missing).toEqual([])
  })
})

describe('loadClientLocale', () => {
  it('registers the locale set for the client', async () => {
    expect(win.ArtalkI18n?.tr).toBeUndefined()

    await expect(loadClientLocale('tr')).resolves.toBe(true)

    expect(win.ArtalkI18n?.tr?.pending).toBe('Beklemede')
    expect(win.ArtalkI18n?.['tr-TR']).toBe(win.ArtalkI18n?.tr)
  })

  it.each(['en', 'zh-CN'])('loads nothing for the bundled locale %j', async (locale) => {
    await expect(loadClientLocale(locale)).resolves.toBe(true)

    expect(win.ArtalkI18n).toBeUndefined()
  })

  it('returns false without throwing if loading fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const loaders = { tr: vi.fn().mockRejectedValue(new Error('chunk load failed')) }

    await expect(loadClientLocale('tr', loaders)).resolves.toBe(false)

    expect(loaders.tr).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalled()
  })
})
