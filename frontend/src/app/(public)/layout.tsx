import type { Metadata } from 'next';
import { PublicNavbar } from '../../components/public/PublicNavbar';
import { PublicFooter } from '../../components/public/PublicFooter';

export const metadata: Metadata = {
  title: 'INFEPOS — Enterprise Retail Operating System',
  description: 'Enterprise-grade cloud retail operating software. Manage stores, inventory, billing, employees, and analytics from one powerful platform. Trusted by retailers worldwide.',
  keywords: ['POS', 'EPOS', 'retail', 'inventory', 'multi-store', 'cloud POS', 'SaaS'],
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-platinum text-slate-900 antialiased">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
