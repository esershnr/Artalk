const STORAGE_KEY = 'atk_sidebar_forced_locale'

/**
 * Match a language tag against the available locales
 *
 * e.g. `tr-TR` matches `tr`, `zh-tw` matches `zh-TW`
 *
 * @returns The matched locale, or an empty string if there is no match
 */
export function matchLocale(tag: string, available: readonly string[]): string {
  const m = /^([a-z]+)(?:[-_]([a-z]+))?$/i.exec(tag.trim())
  if (!m) return ''

  const lang = m[1].toLowerCase()
  const full = m[2] ? `${lang}-${m[2].toUpperCase()}` : lang
  if (available.includes(full)) return full
  if (available.includes(lang)) return lang
  return ''
}

/**
 * Resolve the locale forced by the parent page through the `locale` URL param
 *
 * The URL params are cleared after boot, so the locale is kept in the session
 * storage to survive a reload of the sidebar. An empty, `auto` or unknown value
 * forces nothing, so the sidebar keeps following the backend locale.
 *
 * @param param - The `locale` URL param, `null` to restore the locale kept in the session storage
 * @returns The forced locale, or an empty string if there is none
 */
export function resolveForcedLocale(
  param: string | null,
  available: readonly string[],
  storage: Storage | null = getSessionStorage(),
): string {
  if (param === null) {
    // reloaded after the URL params were cleared
    return matchLocale(safely(() => storage?.getItem(STORAGE_KEY)) || '', available)
  }

  const locale = matchLocale(param, available)
  safely(() => (locale ? storage?.setItem(STORAGE_KEY, locale) : storage?.removeItem(STORAGE_KEY)))
  return locale
}

function getSessionStorage() {
  // throws when the storage is blocked, e.g. third-party iframe storage disabled
  return safely(() => window.sessionStorage) || null
}

function safely<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}
