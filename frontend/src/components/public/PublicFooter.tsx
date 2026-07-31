'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, AtSign, MessageSquare, Rss } from 'lucide-react';
import { Logo } from '../Logo';

const footerColumns = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Book a Demo', href: '/contact' },
    { label: 'Documentation', href: '/docs' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
  ],
  Support: [
    { label: 'Help Center', href: '/docs' },
    { label: 'API Reference', href: '#' },
    { label: 'System Status', href: '#' },
    { label: 'Community', href: '#' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookies', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
};

const socials = [
  { icon: Globe, label: 'Website', href: '#' },
  { icon: AtSign, label: 'Email', href: '#' },
  { icon: MessageSquare, label: 'Community', href: '#' },
  { icon: Rss, label: 'Blog', href: '#' },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center text-slate-900">
              <Logo height={30} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              The cloud EPOS platform for modern retail. One system for stores, inventory,
              and analytics.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {Object.entries(footerColumns).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors duration-200 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} INFEPOS Technologies. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">Made for modern retail.</p>
        </div>
      </div>
    </footer>
  );
}
export default PublicFooter;
