'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Store, Users, Package, Boxes, CreditCard,
  Wallet, Percent, BarChart3, WifiOff, Cloud, Receipt,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.6, ease: EASE } }),
};

const modules = [
  { icon: LayoutDashboard, title: 'Dashboard & Analytics', desc: 'Real-time KPIs, revenue charts, sales trends, and actionable insights — all at a glance.' },
  { icon: Store, title: 'Multi-Store Management', desc: 'Manage unlimited stores from one dashboard. Each store has its own config, staff, and inventory.' },
  { icon: Users, title: 'Staff & RBAC', desc: 'Owner, Manager, Cashier roles with granular permissions. Rank-based hierarchy prevents privilege escalation.' },
  { icon: Package, title: 'Product Catalog', desc: 'SKU management, barcode support, category organization, and variant tracking for every product.' },
  { icon: Boxes, title: 'Inventory Control', desc: 'Real-time stock tracking, low-stock alerts, reorder levels, and inter-store transfer management.' },
  { icon: CreditCard, title: 'POS Billing', desc: 'Lightning-fast checkout with barcode scanning, cart management, discounts, and thermal receipt printing.' },
  { icon: Wallet, title: 'Payment Processing', desc: 'Accept cash, cards, UPI, and digital wallets. Split payments, refunds, and partial payments supported.' },
  { icon: Percent, title: 'Tax & VAT', desc: 'Configurable tax rates per product or category. Automatic GST/VAT calculation on every transaction.' },
  { icon: BarChart3, title: 'Reports & Revenue', desc: 'Sales reports, profit margins, cashier performance, and export to PDF or Excel in one click.' },
  { icon: WifiOff, title: 'Offline Mode', desc: 'Continue selling without internet. Transactions queue locally and auto-sync when reconnected.' },
  { icon: Cloud, title: 'Cloud Sync', desc: 'Real-time data synchronization across all stores and devices. Zero-config, always up to date.' },
  { icon: Receipt, title: 'Subscription & Billing', desc: 'Flexible plans, usage-based billing, and automated invoicing for your SaaS subscription.' },
];

export default function FeaturesPage() {
  return (
    <div className="bg-platinum pt-36 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mx-auto mb-20 max-w-3xl text-center"
        >
          <p className="text-sm font-semibold text-indigo-600">Features</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Everything you need to run your business
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            A complete, modular suite built for modern retail — from POS billing to advanced
            analytics. Every feature is production-ready.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">{mod.title}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-slate-600">{mod.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
