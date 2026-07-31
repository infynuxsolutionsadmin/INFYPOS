'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Code2, BookOpen, Shield, Monitor, HelpCircle,
  ArrowRight, Search,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: EASE } }),
};

const docs = [
  { icon: Rocket, title: 'Getting Started', desc: 'Quick setup guide to get your first store running in under 5 minutes.' },
  { icon: Code2, title: 'API Reference', desc: 'RESTful API documentation with examples for every endpoint.' },
  { icon: BookOpen, title: 'User Guide', desc: 'Comprehensive guide covering every feature of the platform.' },
  { icon: Shield, title: 'Admin Guide', desc: 'RBAC configuration, tenant management, and security best practices.' },
  { icon: Monitor, title: 'POS Integration', desc: 'Hardware setup for barcode scanners, receipt printers, and terminals.' },
  { icon: HelpCircle, title: 'FAQ & Troubleshooting', desc: 'Common issues, solutions, and tips for smooth operations.' },
];

export default function DocsPage() {
  return (
    <div className="bg-platinum pt-36 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl py-16 text-center sm:py-20"
        >
          <p className="text-sm font-semibold text-indigo-600">Documentation</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Documentation & Resources
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Everything you need to integrate, customize, and get the most from INFEPOS.
          </p>

          <div className="relative mx-auto mt-10 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </motion.div>

        <section className="pb-24">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <motion.div
                  key={doc.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-7 shadow-soft transition-all duration-200 hover:border-indigo-200 hover:shadow-soft-md"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-slate-900">{doc.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600">{doc.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-colors duration-200 group-hover:text-indigo-500">
                    <span>Read More</span>
                    <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
