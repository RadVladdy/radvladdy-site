import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { buildLastmod } from './scripts/lastmod.mjs';

const SITE_URL = 'https://radvladdy.com';

export default defineConfig({
  site: SITE_URL,
  // `serialize` stamps each entry with a <lastmod> taken from git history — see
  // scripts/lastmod.mjs for why git and not file mtime. The sitemap carried no
  // lastmod at all until 2026-08-07.
  integrations: [sitemap({ serialize: buildLastmod(SITE_URL) })],
});
