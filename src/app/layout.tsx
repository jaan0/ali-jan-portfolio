import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

import prisma from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@example.com' }
  });

  const avatarUrl = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `/${user.avatarUrl.replace(/^\//, '')}`) + '?v=' + Date.now()
    : '/favicon.ico';

  const baseUrl = 'https://alijan-portfolio.vercel.app'; // Update this to your actual domain
  const name = user?.name || "Ali Jan";
  const title = `${name} | Software Engineer & Full Stack Web Developer`;
  const description = `${name} is a professional Full Stack Web Developer specialized in building modern, scalable web applications with Next.js, React, and Node.js. Explore my portfolio, projects, and professional background.`;

  return {
    title,
    description,
    keywords: ["Ali Jan", "Web Developer", "Full Stack Developer", "Software Engineer", "Portfolio", "Next.js", "React Developer", "JavaScript Expert", "Backend Developer", "Frontend Developer", "Ali Jan Portfolio"],
    authors: [{ name }],
    creator: name,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: `${name} Portfolio`,
      images: [
        {
          url: avatarUrl,
          width: 1200,
          height: 630,
          alt: `${name} - Web Developer Portfolio Preview`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [avatarUrl],
    },
    icons: {
      icon: avatarUrl,
      shortcut: avatarUrl,
      apple: avatarUrl,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        {children}
      </body>
    </html>
  );
}
