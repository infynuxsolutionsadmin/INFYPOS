'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, animate, useScroll, useTransform } from 'framer-motion';
import { Magnetic } from '../../components/public/Magnetic';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  Boxes,
  BarChart3,
  Users,
  Percent,
  WifiOff,
  Cloud,
  Check,
  X,
  Star,
  Search,
  Bell,
  TrendingUp,
  Store,
  ShoppingCart,
  Building2,
  Pill,
  Monitor,
  Shirt,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ────────────────────────────── Hero mockup ────────────────────────────── */

const revenueData = [
  { day: 'Mon', revenue: 6200 },
  { day: 'Tue', revenue: 7400 },
  { day: 'Wed', revenue: 6800 },
  { day: 'Thu', revenue: 8900 },
  { day: 'Fri', revenue: 10200 },
  { day: 'Sat', revenue: 12800 },
  { day: 'Sun', revenue: 11400 },
];

const kpis = [
  { label: 'Revenue', value: '$48,290', delta: '+12.4%' },
  { label: 'Orders', value: '1,284', delta: '+8.1%' },
  { label: 'Avg. basket', value: '$37.62', delta: '+3.2%' },
  { label: 'Stock alerts', value: '12', delta: '4 low' },
];

const recentOrders = [
  { id: '#1042', customer: 'A. Sharma', items: '3 items', total: '$84.20', status: 'Completed' },
  { id: '#1041', customer: 'B. Chen', items: '2 items', total: '$23.40', status: 'Completed' },
  { id: '#1040', customer: 'M. Patel', items: '5 items', total: '$112.05', status: 'Refunded' },
];

const stockItems = [
  { name: 'Espresso Beans', sku: 'SKU-1042', level: 84 },
  { name: 'Milk 1L', sku: 'SKU-1007', level: 28 },
  { name: 'Paper Bags', sku: 'SKU-1190', level: 55 },
];

function DashboardMockup() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-[2.25rem] border border-slate-200 bg-white p-2.5 shadow-soft">
        <div className="overflow-hidden rounded-[1.6rem] bg-slate-950">
          {/* Tablet status bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3">
            <div>
              <p className="text-[11px] text-slate-500">Good morning</p>
              <p className="text-sm font-semibold text-white">Main Street Store</p>
            </div>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-500" />
              <div className="relative">
                <Bell className="h-4 w-4 text-slate-500" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-semibold text-indigo-300">
                AS
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 px-5 pt-4 sm:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3">
                <p className="text-[11px] text-slate-500">{kpi.label}</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="text-sm font-bold tracking-tight text-white">{kpi.value}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      kpi.label === 'Stock alerts'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    <TrendingUp className="h-2.5 w-2.5" />
                    {kpi.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="px-5 pt-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Revenue</p>
                  <p className="text-[11px] text-slate-500">This week · vs last week +18%</p>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-400">
                  Last 7 days
                </span>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(v: number) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#818CF8' }}
                      contentStyle={{
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#F8FAFC',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#818CF8"
                      strokeWidth={2}
                      fill="url(#heroRevenueGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Orders + inventory */}
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Recent orders
              </p>
              <div className="space-y-2.5">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-white">{order.id}</span>
                      <span className="text-slate-500">
                        {order.customer} · {order.items}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{order.total}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          order.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Inventory
              </p>
              <div className="space-y-3.5">
                {stockItems.map((stock) => (
                  <div key={stock.sku}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-slate-300">{stock.name}</span>
                      <span className={stock.level < 40 ? 'font-semibold text-amber-400' : 'text-slate-500'}>
                        {stock.level}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          stock.level < 40 ? 'bg-amber-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${stock.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── Counter ────────────────────────────── */

function Counter({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [inView, value, decimals]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ────────────────────────────── Shared bits ────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={stagger}
      className="mx-auto mb-16 max-w-2xl text-center lg:mb-20"
    >
      <motion.p variants={item} className="text-sm font-semibold text-indigo-600">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={item}
        className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={item} className="mt-5 text-lg leading-relaxed text-slate-600">
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

const miniRevenue = [
  { name: 'Mon', value: 6200 },
  { name: 'Tue', value: 7400 },
  { name: 'Wed', value: 6800 },
  { name: 'Thu', value: 8900 },
  { name: 'Fri', value: 10200 },
  { name: 'Sat', value: 12800 },
];

const barcodeBars = [2, 6, 3, 8, 2, 5, 9, 3, 4, 2, 7, 3, 8, 2, 6, 9, 3, 5, 2, 7, 4];

const customerAvatars = [
  { initials: 'SK', tone: 'bg-indigo-100 text-indigo-600' },
  { initials: 'MR', tone: 'bg-emerald-100 text-emerald-600' },
  { initials: 'AT', tone: 'bg-amber-100 text-amber-600' },
  { initials: 'LJ', tone: 'bg-slate-200 text-slate-600' },
];

const taxRates = ['VAT 20%', 'GST 5%', 'Zero-rated'];

const devices = ['Store 1', 'Store 2', 'HQ'];

const showcaseRows = [
  {
    id: 'dashboard',
    eyebrow: 'Command centre',
    title: 'A dashboard built for decisions, not demos.',
    desc: 'Every metric a store owner actually cares about — revenue, orders, stock, and store performance — surfaced without clutter.',
    bullets: ['Real-time revenue and order tracking', 'Per-store and per-cashier performance', 'Low-stock and reorder alerts, automatically'],
    media: 'image',
    image: '/images/retail_os_dashboard_dark.jpg',
    alt: 'INFEPOS cloud dashboard',
  },
  {
    id: 'pos',
    eyebrow: 'Point of sale',
    title: 'A checkout screen that never slows the line down.',
    desc: 'Barcode scanning, split payments, discounts, and thermal receipt printing — built for speed and built to work offline.',
    bullets: ['Sub-second product search and barcode scan', 'Cash, card, and split payment handling', 'Works offline, syncs when you reconnect'],
    media: 'image',
    image: '/images/premium_epos_terminal_dark.jpg',
    alt: 'INFEPOS point of sale screen',
  },
  {
    id: 'reports',
    eyebrow: 'Reporting',
    title: 'Reports your accountant will actually enjoy.',
    desc: 'Sales, margins, VAT summaries, and cashier performance — exportable to PDF or Excel in one click.',
    bullets: ['VAT and GST summaries per period', 'Profit-and-loss by store, category, or SKU', 'One-click PDF and Excel exports'],
    media: 'report',
  },
  {
    id: 'inventory',
    eyebrow: 'Inventory',
    title: 'Know exactly what is on the shelf. Anywhere.',
    desc: 'Track stock across every location, set reorder points, and move goods between stores with a few clicks.',
    bullets: ['Real-time stock levels across locations', 'Smart reorder-point recommendations', 'Inter-store transfers and adjustments'],
    media: 'inventory',
  },
];

const comparison = [
  {
    title: 'Traditional POS',
    tone: 'muted',
    points: [
      'Single terminal, single location',
      'Manual stock counting on paper',
      'Tax calculated by hand, errors happen',
      'Sales lost during network outages',
      'Reports stitched together in spreadsheets',
    ],
  },
  {
    title: 'INFYPOS',
    tone: 'accent',
    points: [
      'One cloud platform, unlimited stores',
      'Live inventory across every location',
      'VAT and GST calculated automatically',
      'Keeps selling offline, then syncs',
      'Real-time reports for every store',
    ],
  },
  {
    title: 'The outcome',
    tone: 'highlight',
    points: [
      'Hours saved every single day',
      'Zero lost sales during outages',
      '100% compliant tax records',
      'Full visibility of the whole business',
    ],
  },
];

const testimonials = [
  {
    quote:
      'We moved five stores onto INFYPOS in a weekend. Stock reconciliation that used to take a full day now happens automatically.',
    name: 'Sarah Mitchell',
    role: 'Operations Director, Mitchell Grocers',
    initials: 'SM',
  },
  {
    quote:
      'The offline mode sold it for us. Our tills kept running through a router failure and every transaction synced the moment we were back online.',
    name: 'James Okafor',
    role: 'Owner, Okafor Convenience',
    initials: 'JO',
  },
  {
    quote:
      'VAT reporting alone has saved our accountant days of work. The dashboards are the first ones our team actually opens every morning.',
    name: 'Elena Rossi',
    role: 'CFO, Rossi Fashion Group',
    initials: 'ER',
  },
];

const trustedBy = [
  { icon: Building2, label: 'Retail Businesses' },
  { icon: Store, label: 'Convenience Stores' },
  { icon: ShoppingCart, label: 'Supermarkets' },
  { icon: Pill, label: 'Pharmacies' },
  { icon: Monitor, label: 'Electronics' },
  { icon: Shirt, label: 'Fashion' },
];

/* ────────────────────────────── Page ────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <div className="bg-platinum text-slate-900 antialiased">
      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-24 pt-36 lg:grid-cols-2 lg:gap-20 lg:pb-32 lg:pt-44">
          <motion.div style={{ opacity: copyOpacity }} className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="text-sm font-semibold tracking-wide text-indigo-600">
                Cloud EPOS for modern retail
              </p>
              <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.25rem]">
                The complete cloud EPOS platform for modern retail.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                INFEPOS unifies point of sale, inventory, and reporting for multi-store
                retailers — on the hardware you already own, in the cloud you can trust.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Magnetic>
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-7 text-base font-semibold text-white transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98]"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 px-7 text-base font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
              >
                Book Live Demo
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-6 text-sm text-slate-400"
            >
              14-day free trial · No credit card required
            </motion.p>
          </motion.div>

          <motion.div
            style={{ y: mockupY }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
          >
            <div className="animate-float-soft-sm">
              <DashboardMockup />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Trusted by ─── */}
      <section className="border-y border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-600">
            Trusted by independent retailers and growing chains
          </p>
          <div className="marquee-mask mt-10 overflow-hidden">
            <div className="animate-marquee flex w-max hover:[animation-play-state:paused]">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-x-12 pr-12">
                  {trustedBy.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-2 text-slate-500">
                        <Icon className="h-4 w-4" />
                        <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="Platform"
            title="Everything your stores need. Nothing they don't."
            description="Six capabilities, one system. Built to be adopted in a day and to scale with every location you open."
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-6"
          >
            {/* Sales Analytics — wide */}
            <motion.div
              variants={item}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md md:col-span-2 lg:col-span-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Sales Analytics</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Revenue, margins, and cashier performance in one view.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +12.4% this week
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Revenue', value: <><span>$</span><Counter value={48290} /></>, tone: 'text-slate-900' },
                  { label: 'Transactions', value: <Counter value={1284} />, tone: 'text-slate-900' },
                  { label: 'Avg. basket', value: '$37.62', tone: 'text-slate-900' },
                  { label: 'Stock alerts', value: '12', tone: 'text-amber-600' },
                ].map((cell) => (
                  <div key={cell.label} className="rounded-xl bg-slate-50 px-3.5 py-3">
                    <p className="text-[11px] text-slate-500">{cell.label}</p>
                    <p className={`mt-1 text-base font-bold tracking-tight ${cell.tone}`}>{cell.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniRevenue} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bentoRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                      tickFormatter={(v: number) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ stroke: '#C7D2FE' }}
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#0F172A',
                        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      }}
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fill="url(#bentoRevenueGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Inventory Management */}
            <motion.div
              variants={item}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md lg:col-span-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                <Boxes className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Inventory Management</h3>
              <div className="mt-5 space-y-3.5">
                {stockItems.map((stock) => (
                  <div key={stock.sku}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-slate-700">{stock.name}</span>
                      <span className={stock.level < 40 ? 'font-semibold text-amber-600' : 'text-slate-500'}>
                        {stock.level}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          stock.level < 40 ? 'bg-amber-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${stock.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Live stock, low-stock alerts, and transfers — in real time.
              </p>
            </motion.div>

            {/* Offline POS — barcode scan */}
            <motion.div
              variants={item}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md lg:col-span-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                <WifiOff className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Offline POS</h3>
              <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4">
                <div className="flex h-14 items-stretch gap-[3px]">
                  {barcodeBars.map((w, i) => (
                    <div key={i} className="bg-slate-900" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="scan-line pointer-events-none absolute inset-x-3 h-0.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                <div className="absolute bottom-2 right-3 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Scanned
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Keep selling through outages. Every transaction queues and syncs.
              </p>
            </motion.div>

            {/* Customer Management */}
            <motion.div
              variants={item}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md lg:col-span-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Customer Management</h3>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {customerAvatars.map((a) => (
                    <div
                      key={a.initials}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold ${a.tone}`}
                    >
                      {a.initials}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-slate-900">
                    <Counter value={1284} />
                  </p>
                  <p className="text-xs text-slate-500">customers & loyalty</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Purchase history and loyalty that bring shoppers back.
              </p>
            </motion.div>

            {/* VAT Ready */}
            <motion.div
              variants={item}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md lg:col-span-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                <Percent className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">VAT Ready</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {taxRates.map((rate) => (
                  <span
                    key={rate}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <Check className="h-3 w-3 text-indigo-600" strokeWidth={3} />
                    {rate}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Region-aware tax, calculated automatically on every receipt.
              </p>
            </motion.div>

            {/* Cloud Sync — wide */}
            <motion.div
              variants={item}
              className="group flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md sm:flex-row sm:items-center md:col-span-2 lg:col-span-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Cloud Sync</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    All stores, all devices, one source of truth — always in sync.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {devices.map((device) => (
                  <div
                    key={device}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    {device}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Product showcase ─── */}
      <section id="solutions" className="scroll-mt-24 border-t border-slate-200 py-32 lg:py-40">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="Solutions"
            title="One platform, every part of the business."
            description="From the front counter to the back office, INFEPOS covers the whole retail workflow."
          />

          <div className="space-y-24 lg:space-y-32">
            {showcaseRows.map((row, i) => {
              const reversed = i % 2 === 1;
              return (
                <div
                  key={row.id}
                  className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
                >
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className={reversed ? 'lg:order-2' : ''}
                  >
                    <motion.p variants={item} className="text-sm font-semibold text-indigo-600">
                      {row.eyebrow}
                    </motion.p>
                    <motion.h3
                      variants={item}
                      className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
                    >
                      {row.title}
                    </motion.h3>
                    <motion.p variants={item} className="mt-5 text-lg leading-relaxed text-slate-600">
                      {row.desc}
                    </motion.p>
                    <motion.ul variants={stagger} className="mt-7 space-y-3.5">
                      {row.bullets.map((bullet) => (
                        <motion.li
                          key={bullet}
                          variants={item}
                          className="flex items-start gap-3 text-base text-slate-600"
                        >
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {bullet}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className={reversed ? 'lg:order-1' : ''}
                  >
                    {row.media === 'image' ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                        <Image
                          src={row.image!}
                          alt={row.alt!}
                          width={1200}
                          height={800}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    ) : row.media === 'report' ? (
                      <ReportMockup />
                    ) : (
                      <InventoryMockup />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Statistics ─── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white py-16 shadow-soft">
            <div className="grid gap-12 px-8 text-center sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: 15, suffix: '+', label: 'Stores' },
                { value: 99.9, decimals: 1, suffix: '%', label: 'Uptime' },
                { value: 50, suffix: 'K+', label: 'Transactions' },
                { value: 24, suffix: '/7', label: 'Support' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                    <Counter value={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-base text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why INFYPOS ─── */}
      <section className="border-t border-slate-200 py-32 lg:py-40">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why INFYPOS"
            title="Modern retail deserves modern software."
            description="Legacy terminals were built for a single till in a single shop. The world has moved on."
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 lg:grid-cols-3"
          >
            {comparison.map((col) => (
              <motion.div
                key={col.title}
                variants={item}
                className={`rounded-2xl border p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md ${
                  col.tone === 'accent'
                    ? 'border-indigo-200 bg-indigo-50/50'
                    : col.tone === 'highlight'
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200 bg-white opacity-80 hover:opacity-100'
                }`}
              >
                <h3 className="text-lg font-semibold text-slate-900">{col.title}</h3>
                <ul className="mt-6 space-y-4">
                  {col.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-base text-slate-600">
                      {col.tone === 'muted' ? (
                        <X className="mt-1 h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.5} />
                      ) : (
                        <span
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            col.tone === 'accent' ? 'bg-indigo-600 text-white' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-32 lg:py-40">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <SectionHeader
            eyebrow="Customers"
            title="Trusted by retailers who run real stores."
            description="From single-shop operators to multi-location chains."
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 lg:grid-cols-3"
          >
            {testimonials.map((t) => (
              <motion.figure
                key={t.name}
                variants={item}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md"
              >
                <div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mt-6 text-lg leading-relaxed text-slate-700">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>
                <figcaption className="mt-8 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-600">{t.role}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-6 pb-32 lg:px-8 lg:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-900 px-8 py-24 text-center lg:py-32"
        >
          <h2 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Ready to modernise your stores?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Join the retailers running their entire operation on INFEPOS. Set up your
            first store in under 15 minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic>
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-100 active:scale-[0.98]"
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-base font-semibold text-white transition-all duration-200 hover:border-white/50 hover:bg-white/5 active:scale-[0.98]"
            >
              Book a Demo
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ────────────────────────────── Small mockups ────────────────────────────── */

const reportBars = [42, 58, 46, 70, 62, 84, 66, 92, 76, 88, 72, 96];

function ReportMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Monthly report</p>
          <p className="text-[11px] text-slate-400">Revenue vs. target · January</p>
        </div>
        <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          Export PDF
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Gross sales', value: '$182,400' },
          { label: 'VAT collected', value: '$36,480' },
          { label: 'Net profit', value: '$61,920' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex h-36 items-end gap-2">
        {reportBars.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-md ${
              i === reportBars.length - 1 ? 'bg-indigo-600' : 'bg-indigo-200'
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-400">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
}

const inventoryRows = [
  { name: 'Espresso Beans 1kg', sku: 'SKU-1042', qty: '340 units', status: 'Healthy', level: 84, tone: 'indigo' },
  { name: 'Milk 1L', sku: 'SKU-1007', qty: '18 units', status: 'Reorder', level: 28, tone: 'amber' },
  { name: 'Paper Bags (100)', sku: 'SKU-1190', qty: '96 units', status: 'Healthy', level: 55, tone: 'indigo' },
  { name: 'Almond Croissant', sku: 'SKU-1203', qty: '9 units', status: 'Reorder', level: 22, tone: 'amber' },
];

function InventoryMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Inventory</p>
          <p className="text-[11px] text-slate-400">Main Street Store · live</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
          Synced just now
        </span>
      </div>
      <div className="mt-5 divide-y divide-slate-200">
        {inventoryRows.map((row) => (
          <div key={row.sku} className="flex items-center gap-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600">
              {row.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800">{row.name}</p>
                <p className="text-xs text-slate-400">{row.qty}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      row.tone === 'amber' ? 'bg-amber-400' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${row.level}%` }}
                  />
                </div>
                <span
                  className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-medium ${
                    row.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {row.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
