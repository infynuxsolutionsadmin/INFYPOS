import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '../providers/AppProviders';
import { LayoutShell } from '../components/LayoutShell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'INFEPOS Enterprise Admin Panel',
  description: 'Production-Grade Multi-Tenant SaaS POS Admin Panel for INFEPOS Retail Ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <AppProviders>
          <LayoutShell>{children}</LayoutShell>
        </AppProviders>
      </body>
    </html>
  );
}
