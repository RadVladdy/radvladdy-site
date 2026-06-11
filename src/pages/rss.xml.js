import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('writing')).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  return rss({
    title: 'RadVladdy',
    description: 'Writing, projects, and signal from the Bitcoin frontier.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.subtitle ?? '',
      pubDate: p.data.date,
      link: `/writing/${p.id}`,
    })),
  });
}
