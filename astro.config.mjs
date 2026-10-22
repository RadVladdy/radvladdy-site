import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { buildLastmod } from './scripts/lastmod.mjs';
import { rehypeTrailingSlash } from './scripts/trailing-slash.mjs';

const SITE_URL = 'https://radvladdy.com';

export default defineConfig({
  site: SITE_URL,
  // `serialize` stamps each entry with a <lastmod> taken from git history — see
  // scripts/lastmod.mjs for why git and not file mtime. The sitemap carried no
  // lastmod at all until 2026-08-07.
  integrations: [sitemap({ serialize: buildLastmod(SITE_URL) })],
  // Internal links inside rendered markdown are normalised to the
  // trailing-slash form here, at render time, so the OTS-stamped essay sources
  // stay byte-identical — see scripts/trailing-slash.mjs for why the form
  // matters (this Worker answers 307 between the two).
  // Astro 7 defaults: Sätteri markdown + 'jsx' whitespace — both pinned back to
  // the v6 behaviour so the upgrade changes no rendered output.
  compressHTML: true,
  markdown: { processor: unified(), rehypePlugins: [rehypeTrailingSlash] },
});
