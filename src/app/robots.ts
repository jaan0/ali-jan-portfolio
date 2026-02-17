import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/daddy/'],
        },
        sitemap: 'https://alijan-portfolio.vercel.app/sitemap.xml', // Update this to your actual domain
    }
}
