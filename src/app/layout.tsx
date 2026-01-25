import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SmoothScroller } from '@/components/layout/smooth-scroller';
import { Header2 } from '@/components/ui/header-2';
import { AnimatedFooter } from '@/components/layout/animated-footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.postpipe.in'),
  title: {
    template: 'PostPipe | %s',
    default: 'PostPipe - The Largest Next.js Backend Component Library',
  },
  description:
    'PostPipe is the ultimate Next.js backend component library and static ingest system. Build, deploy, and scale your applications faster with ready-to-use backend logic, connectors, and agentic AI tools.',
  keywords: [
    'Next.js',
    'React',
    'Backend',
    'Component Library',
    'Static Ingest',
    'Form Builder',
    'Workflow Automation',
    'Agentic AI',
    'Web Development',
    'Open Source',
    'PostgreSQL',
    'MongoDB',
    'Supabase',
  ],
  authors: [{ name: 'Sourodip-1', url: 'https://github.com/Sourodip-1' }],
  creator: 'Sourodip-1',
  publisher: 'PostPipe',
  openGraph: {
    title: 'PostPipe - The Largest Next.js Backend Component Library',
    description:
      'Build faster with PostPipe. The largest backend component library for Next.js, featuring a visual form builder, workflow automation, and AI-powered development tools.',
    url: 'https://www.postpipe.in',
    siteName: 'PostPipe',
    images: [
      {
        url: '/og-image.png', // Ensure you have an og-image.png in public folder or use a placeholder
        width: 1200,
        height: 630,
        alt: 'PostPipe Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostPipe - Default Backend for Modern Web',
    description:
      'Scale your Next.js apps with PostPipe. Visual builder, secure auth, and instant backend connectors.',
    creator: '@sourodip_1', // Update if there is an official handle
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/PostPipe-Black.png' },
      { url: '/PostPipe-Black.svg', media: '(prefers-color-scheme: light)' },
      { url: '/PostPipe.svg', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: ['/PostPipe-Black.png'],
    apple: [
      { url: '/PostPipe-Black.png' },
    ],
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header2 />
            <SmoothScroller>
              <main className="flex-1">{children}</main>
              <AnimatedFooter />
            </SmoothScroller>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
