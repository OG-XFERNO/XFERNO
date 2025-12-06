import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'XFERNO | Multi-Chain Token Launchpad',
    template: '%s | XFERNO',
  },
  description:
    'Launch here, graduate to the multiverse. XFERNO is a professional-grade, multi-chain token launchpad and DEX.',
  keywords: [
    'crypto',
    'token',
    'launchpad',
    'dex',
    'multichain',
    'ethereum',
    'solana',
    'defi',
    'web3',
  ],
  authors: [{ name: 'XFERNO Team' }],
  creator: 'XFERNO',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://xferno.io',
    siteName: 'XFERNO',
    title: 'XFERNO | Multi-Chain Token Launchpad',
    description: 'Launch here, graduate to the multiverse.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'XFERNO',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XFERNO | Multi-Chain Token Launchpad',
    description: 'Launch here, graduate to the multiverse.',
    images: ['/og-image.png'],
    creator: '@xferno',
  },
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
