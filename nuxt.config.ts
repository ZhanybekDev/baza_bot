import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-16',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },
  runtimeConfig: {
    databaseUrl: '',
    bothubApiKey: '',
    bothubBaseUrl: 'https://bothub.chat/api/v2/openai/v1',
    sonioxApiKey: '',
    telegramBotToken: '',
    telegramWebhookSecret: '',
  },
  nitro: {
    // pg и prisma — нативные модули, не бандлим их в серверный бандл
    externals: { external: ['pg', '@prisma/client', '@prisma/adapter-pg'] },
  },
})
