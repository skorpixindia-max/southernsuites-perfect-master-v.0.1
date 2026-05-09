import { MetadataRoute } from 'next';
import { HOTELS } from '@/lib/hotels-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://southernsuites.com';

  const hotelPages = HOTELS.map((hotel) => ({
    url: `${baseUrl}/hotels/${hotel.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...hotelPages,
  ];
}
