import './global.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://saabiz.com'),
  title: {
    default: 'Saabiz — Merchant of Record Platform',
    template: '%s | Saabiz',
  },
  description: 'Sell your software globally with integrated payments, subscriptions, and licensing. The modern MoR platform built for SaaS companies.',
  keywords: [
    'merchant of record',
    'saas payments',
    'global payments',
    'software licensing',
    'subscription management',
    'fraud protection',
    'tax compliance',
  ],
  authors: [{ name: 'Saabiz' }],
  creator: 'Saabiz',
  publisher: 'Saabiz',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://saabiz.com',
    siteName: 'Saabiz',
    title: 'Saabiz — Merchant of Record Platform',
    description: 'Sell your software globally with integrated payments, subscriptions, and licensing.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Saabiz - Merchant of Record Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saabiz — Merchant of Record Platform',
    description: 'Sell your software globally with integrated payments, subscriptions, and licensing.',
    images: ['/og-image.png'],
    creator: '@saabiz',
  },
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2310B981"/><stop offset="100%" style="stop-color:%23059669"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(%23g)"/><text x="16" y="22" font-family="system-ui" font-size="16" font-weight="700" fill="white" text-anchor="middle">S</text></svg>',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#090910',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }); }` }} />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
