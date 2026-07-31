'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, ShoppingBag, Pill, Shirt, Monitor, Store } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: EASE } }),
};

const timeline = [
  { year: '2024', title: 'Founded', desc: 'INFEPOS was born from a simple idea — modern retail deserves modern software.' },
  { year: '2024', title: 'First 100 customers', desc: 'Within months, 100 retailers across 12 countries trusted us with their operations.' },
  { year: '2025', title: 'Multi-store launch', desc: 'Released unlimited multi-store management with real-time cross-location sync.' },
  { year: '2026', title: 'Enterprise edition', desc: 'Launched enterprise features including white-label, on-premise, and custom SLAs.' },
];

const industries = [
  { icon: ShoppingBag, name: 'Retail Chains' },
  { icon: Store, name: 'Supermarkets' },
  { icon: Pill, name: 'Pharmacies' },
  { icon: Shirt, name: 'Fashion & Apparel' },
  { icon: Monitor, name: 'Electronics' },
  { icon: Store, name: 'Convenience Stores' },
];

const values = [
  { icon: Target, title: 'Mission', desc: 'To make enterprise-grade retail technology accessible to businesses of every size — from a single shop to a global chain.' },
  { icon: Eye, title: 'Vision', desc: 'A world where every retailer operates with the efficiency and insight of the largest enterprises.' },
];

export default function AboutPage() {
  return (
    <div className="bg-platinum pt-36 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-3xl py-16 text-center sm:py-20"
        >
          <p className="text-sm font-semibold text-indigo-600">About INFEPOS</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Empowering retail businesses worldwide
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            We are building the operating system for modern retail — a platform that helps
            businesses sell more, manage smarter, and grow faster.
          </p>
        </motion.div>

        <section className="grid gap-6 py-20 sm:grid-cols-2">
          {values.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-slate-200 bg-white p-9 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{card.desc}</p>
              </motion.div>
            );
          })}
        </section>

        <section className="border-t border-slate-200 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <p className="text-sm font-semibold text-indigo-600">Our journey</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The INFEPOS story
            </h2>
          </motion.div>
          <div className="mx-auto max-w-2xl space-y-8">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-16 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {item.year}
                  </div>
                  {i < timeline.length - 1 && <div className="mt-2 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <p className="text-sm font-semibold text-indigo-600">Who uses INFEPOS</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for every retail sector
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <motion.div
                  key={ind.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft-md"
                >
                  <Icon className="mx-auto h-5 w-5 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">{ind.name}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
