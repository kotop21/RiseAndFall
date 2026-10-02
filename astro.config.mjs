import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kotop21.github.io',
  base: '/RiseAndFall',
  trailingSlash: 'always',

  build: {
    inlineStylesheets: 'never'
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          ru: 'ru',
        },
      },
      filter: (page) => page !== 'https://kotop21.github.io/RiseAndFall/',
    })
  ]
});