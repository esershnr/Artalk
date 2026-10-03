type LocaleLoader = () => Promise<unknown>

/**
 * Loaders of the Artalk client locale sets which are not bundled into the client
 *
 * The client only bundles `en` and `zh-CN`, the other locale sets are external
 * and register themselves to `window.ArtalkI18n` when loaded. Each one becomes
 * a lazy chunk of the sidebar, so only the forced locale is downloaded.
 */
export const clientLocaleLoaders: Record<string, LocaleLoader> = Object.fromEntries(
  Object.entries(
    import.meta.glob([
      '../../../artalk/src/i18n/*.ts',
      '!../../../artalk/src/i18n/{index,external,en,zh-CN}.ts',
    ]),
  ).map(([path, loader]) => [path.replace(/^.*\/(.+)\.ts$/, '$1'), loader]),
)

/**
 * Make the locale set of a forced locale available to the Artalk client
 *
 * The backend only sends the locale set of its own locale, so a forced locale
 * which differs from the backend locale has to be loaded by the sidebar.
 *
 * @returns `false` if loading failed, `true` otherwise (also when there is nothing to load)
 */
export async function loadClientLocale(
  locale: string,
  loaders: Record<string, LocaleLoader> = clientLocaleLoaders,
): Promise<boolean> {
  const load = loaders[locale]
  if (!load) return true // bundled into the client

  try {
    await load()
    return true
  } catch (err) {
    console.warn(`[artalk-sidebar] Failed to load the client locale "${locale}"`, err)
    return false
  }
}
