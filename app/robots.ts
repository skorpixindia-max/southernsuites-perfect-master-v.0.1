import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: 'https://southernsuites.com/sitemap.xml',
  };
}
