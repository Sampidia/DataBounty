import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/data', '/api/admin/'],
    },
    sitemap: 'https://databounty.sampidia.com/sitemap.xml',
  };
}
