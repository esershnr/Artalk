import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Artalk from '@esershnr/artalk'
import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { setupI18n } from './i18n'
import '@esershnr/artalk/Artalk.css'
import './style.scss'
import App from './App.vue'
import { bootParams, setArtalk } from './global'
import { setupArtalk, syncArtalkUser } from './artalk'
import './lib/promise-polyfill'

// I18n
// @see https://vue-i18n.intlify.dev
const { i18n, setLocale } = setupI18n()

// Debugging
const ARTALK_LOCALE_KEY = 'atk_sidebar_forced_locale'

// Immediately apply local passed from parent via URL params if present
let urlLocale = bootParams.locale && bootParams.locale !== 'auto' ? bootParams.locale : ''

// Store in sessionStorage to survive potential reloads (since replaceState clears URL)
if (urlLocale) {
  sessionStorage.setItem(ARTALK_LOCALE_KEY, urlLocale)
} else {
  urlLocale = sessionStorage.getItem(ARTALK_LOCALE_KEY) || ''
}

if (urlLocale) {
  setLocale(urlLocale)
}

// Router
// @see https://github.com/posva/unplugin-vue-router
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
        // PRIORITIZE: The locale passed from the parent site or stored in session
        // FALLBACK: The locale set in the Artalk backend/admin panel
        const locale = urlLocale || conf.locale

        if (typeof locale === 'string' && locale !== 'auto') {
          await setLocale(locale) // update i18n locale
        }

        if (!artalkLoaded) {
          artalkLoaded = true
          notifyArtalkLoaded(artalk!)
        }
      })
    })

    artalk = setupArtalk()
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
