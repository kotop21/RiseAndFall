// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kotop21.github.io',
  base: '/RiseAndFall',
  trailingSlash: 'always',

  build: {
    inlineStylesheets: 'never'
  },

  integrations: [sitemap()]
});