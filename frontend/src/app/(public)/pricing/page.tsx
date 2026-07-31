'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronDown } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: EASE } }),
};

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 29,
    desc: 'Perfect for single-store businesses',
    features: ['1 Store', '2 Users', '500 Products', 'POS Billing', 'Basic Reports', 'Email Support'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    monthlyPrice: 79,
    desc: 'For growing multi-store businesses',
    popular: true,
    features: ['5 Stores', '10 Users', 'Unlimited Products', 'Inventory Management', 'Advanced Reports', 'Priority Support', 'RBAC', 'API Access'],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    desc: 'For large organizations with custom needs',
    features: ['Unlimited Stores', 'Unlimited Users', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'White-Label'],
    cta: 'Contact Sales',
  },
];

const faqs = [
  { q: 'Can I try INFEPOS before committing?', a: 'Yes! All plans come with a 14-day free trial. No credit card required. Cancel anytime during the trial.' },
  { q: 'What happens after my trial ends?', a: 'You will be prompted to select a plan. Your data is preserved for 30 days after trial expiry, so you never lose anything.' },
  { q: 'Can I upgrade or downgrade my plan?', a: 'Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.' },
  { q: 'Do you offer discounts for nonprofits?', a: 'Yes, we offer 30% off for registered nonprofits and educational institutions. Contact our sales team.' },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-platinum pt-36 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold text-indigo-600">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Start free for 14 days. No credit card required. Cancel anytime.
          </p>

          <div className="relative mt-8 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            {[
              { label: 'Monthly', value: false },
              { label: 'Yearly · Save 20%', value: true },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => setYearly(opt.value)}
                className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
                  yearly === opt.value ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yearly === opt.value && (
                  <motion.span
                    layoutId="pricingPill"
                    className="absolute inset-0 -z-10 rounded-full bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md ${
                plan.popular
                  ? 'border-indigo-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{plan.desc}</p>

              <div className="mt-6">
                {plan.monthlyPrice ? (
                  <p className="text-4xl font-bold tracking-tight text-slate-900">
                    ${yearly ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice}
                    <span className="text-base font-normal text-slate-400">/mo</span>
                  </p>
                ) : (
                  <p className="text-4xl font-bold tracking-tight text-slate-900">Custom</p>
                )}
              </div>

              <ul className="mt-8 flex-1 space-y-3 border-t border-slate-200 pt-7">
                {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-base text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span>{f}</span>
                </li>
                ))}
              </ul>

              <Link
                href={plan.monthlyPrice ? '/register' : '/contact'}
                className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-24 max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors duration-200 hover:bg-slate-50"
                >
                  <span className="text-base font-medium text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-slate-200 px-6 py-5 text-base leading-relaxed text-slate-600">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
