// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kotop21.github.io',
  base: '/название_репозитория',
  build: {
    inlineStylesheets: 'never',
  },
  compressHTML: true,
});
