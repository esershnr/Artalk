import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Artalk from 'artalk'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { availableLocales, setupI18n } from './i18n'
import 'artalk/Artalk.css'
import './style.scss'
import App from './App.vue'
import { bootParams, setArtalk } from './global'
import { setupArtalk, syncArtalkUser } from './artalk'
import { resolveForcedLocale } from './lib/forced-locale'
import './lib/promise-polyfill'

// I18n
// @see https://vue-i18n.intlify.dev
const { i18n, setLocale } = setupI18n()

// The locale passed by the parent page takes precedence over the backend locale
const forcedLocale = resolveForcedLocale(bootParams.locale, availableLocales)

// Router
// @see https://router.vuejs.org/
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Pinia
// @see https://pinia.vuejs.org
const pinia = createPinia()

// Artalk
// @see https://artalk.js.org
const artalkLoader = () =>
  new Promise<Artalk>((notifyArtalkLoaded) => {
    let artalkLoaded = false
    let artalk: Artalk | null = null

    Artalk.use((ctx) => {
      // When artalk is ready, notify the loader and load the locale
      ctx.watchConf(['locale'], async (conf) => {
        const locale = forcedLocale || conf.locale
        if (typeof locale === 'string' && locale !== 'auto') await setLocale(locale) // update i18n locale

        if (!artalkLoaded) {
          artalkLoaded = true
          notifyArtalkLoaded(artalk!)
        }
      })
    })

    artalk = setupArtalk(forcedLocale)
  })

// Mount Vue app
;(async () => {
  const artalk = await artalkLoader()
  setArtalk(artalk)

  const app = createApp(App)
  app.use(i18n)
  app.use(router)
  app.use(pinia)

  // user sync from artalk to sidebar
  await syncArtalkUser(artalk.ctx, router)

  app.mount('#app')
})()
