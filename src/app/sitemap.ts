import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/audit', '/privacy', '/terms', '/data-deletion'].map((path) => ({ url: `${site.url}${path}` }));
}
