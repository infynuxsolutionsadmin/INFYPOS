'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: EASE } }),
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

const faqs = [
  { q: 'What is the typical onboarding time?', a: 'Most businesses are fully operational within 24 hours. Our team provides guided setup and training.' },
  { q: 'Do you offer custom enterprise solutions?', a: 'Yes. Our enterprise team works with you to deliver custom integrations, on-premise deployments, and tailored SLAs.' },
  { q: 'Is there a dedicated account manager?', a: 'Enterprise plan customers receive a dedicated account manager for priority support and strategic guidance.' },
  { q: 'What regions do you support?', a: 'INFEPOS is available globally with multi-currency and multi-timezone support across 50+ countries.' },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Message sent! Our team will respond within 24 hours.');
    reset();
  };

  return (
    <div className="bg-platinum pt-36 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto max-w-2xl py-16 text-center sm:py-20"
        >
          <p className="text-sm font-semibold text-indigo-600">Contact</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Get in touch
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Have questions about INFEPOS? Our team is here to help you find the right solution.
          </p>
        </motion.div>

        <section className="grid gap-8 pb-20 lg:grid-cols-5">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft lg:col-span-3"
          >
            <h2 className="text-xl font-semibold text-slate-900">Send us a message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Full name *</label>
                  <input {...register('name', { required: true })} className={inputClass} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className={labelClass}>Work email *</label>
                  <input type="email" {...register('email', { required: true })} className={inputClass} placeholder="jane@company.com" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Company</label>
                  <input {...register('company')} className={inputClass} placeholder="Acme Retail" />
                </div>
                <div>
                  <label className={labelClass}>Topic *</label>
                  <select {...register('subject', { required: true })} className={inputClass} defaultValue="">
                    <option value="" disabled>
                      Select a topic
                    </option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="enterprise">Enterprise Plan</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Message *</label>
                <textarea
                  {...register('message', { required: true })}
                  rows={5}
                  className={`${inputClass} resize-none`}
                  placeholder="Tell us about your requirements..."
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-indigo-600 px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </motion.button>
              {errors.name || errors.email || errors.subject || errors.message ? (
                <p className="text-sm text-red-600">Please fill in all required fields.</p>
              ) : null}
            </form>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="space-y-5 lg:col-span-2"
          >
            {[
              { icon: Mail, title: 'Email', info: 'hello@infepos.com', sub: 'We respond within 24 hours' },
              { icon: Phone, title: 'Phone', info: '+1 (555) 123-4567', sub: 'Mon–Fri, 9am–6pm EST' },
              { icon: MapPin, title: 'Office', info: '123 Business Avenue', sub: 'San Francisco, CA 94105' },
              { icon: Clock, title: 'Business hours', info: 'Monday – Friday', sub: '9:00 AM – 6:00 PM EST' },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all duration-200 hover:border-slate-300 hover:shadow-soft-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-200 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-indigo-100">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{c.title}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{c.info}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{c.sub}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </section>

        <section className="border-t border-slate-200 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900">
              Support FAQ
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
        </section>
      </div>
    </div>
  );
}
