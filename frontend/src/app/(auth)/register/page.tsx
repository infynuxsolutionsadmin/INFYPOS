'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, User, Building, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../../services/auth.service';
import { useAuth } from '../../../contexts/AuthContext';
import { Logo } from '../../../components/Logo';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  tenantName: z.string().min(2, 'Business name is required'),
  tenantSlug: z.string().min(2, 'Workspace slug is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

export default function RegisterPage() {
  const router = useRouter();
  const { loginState } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', phone: '', tenantName: '', tenantSlug: '' },
  });

  const values = watch();

  React.useEffect(() => {
    if (values.tenantName) {
      const slug = values.tenantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('tenantSlug', slug);
    }
  }, [values.tenantName, setValue]);

  const nextStep = async () => {
    let valid = false;
    if (step === 0) valid = await trigger(['firstName', 'lastName', 'email', 'password']);
    if (step === 1) valid = await trigger(['tenantName', 'tenantSlug']);
    if (valid) { setDirection(1); setStep(step + 1); }
  };

  const prevStep = () => { setDirection(-1); setStep(step - 1); };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.data?.accessToken && res.data?.refreshToken) {
        loginState(res.data.accessToken, res.data.refreshToken);
        toast.success('Business created successfully!');
        router.push('/dashboard');
      } else {
        toast.error('Invalid response payload');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Account', icon: User },
    { label: 'Business', icon: Building },
    { label: 'Confirm', icon: CheckCircle },
  ];

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition";
  const labelClass = "block text-xs font-medium text-white/40 mb-1.5";
  const errorClass = "text-red-400 text-[11px] mt-1";

  return (
    <div className="text-white">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex justify-center">
          <Logo height={36} />
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold">Create your business</h2>
        <p className="text-sm text-white/40 mt-1">Start your 14-day free trial</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <React.Fragment key={i}>
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'text-white/20 border border-white/[0.06]'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div key="step0" custom={direction} variants={stepVariants}
                initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name *</label>
                    <input {...register('firstName')} className={inputClass} placeholder="John" />
                    {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Last Name *</label>
                    <input {...register('lastName')} className={inputClass} placeholder="Smith" />
                    {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input type="email" {...register('email')} className={inputClass} placeholder="john@company.com" />
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} {...register('password')} className={inputClass} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorClass}>{errors.password.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Phone (Optional)</label>
                  <input {...register('phone')} className={inputClass} placeholder="+1 (555) 123-4567" />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={stepVariants}
                initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                className="space-y-4">
                <div>
                  <label className={labelClass}>Business Name *</label>
                  <input {...register('tenantName')}
                    className={inputClass} placeholder="Acme Retail" />
                  {errors.tenantName && <p className={errorClass}>{errors.tenantName.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Business Slug *</label>
                  <input {...register('tenantSlug')} className={inputClass} placeholder="acme-retail" />
                  <p className="text-[10px] text-white/20 mt-1">This will be your unique identifier</p>
                  {errors.tenantSlug && <p className={errorClass}>{errors.tenantSlug.message}</p>}
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                  <p className="text-xs text-blue-400/60">
                    <strong className="text-blue-400">Note:</strong> Your first store and admin role will be created automatically when you register.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={stepVariants}
                initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}
                className="space-y-4">
                <h3 className="text-sm font-bold text-white/60 mb-4">Review Your Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: `${values.firstName} ${values.lastName}` },
                    { label: 'Email', value: values.email },
                    { label: 'Business', value: values.tenantName },
                    { label: 'Slug', value: values.tenantSlug },
                    { label: 'Phone', value: values.phone || 'Not provided' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-white/30">{item.label}</span>
                      <span className="text-sm text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button type="button" onClick={prevStep}
                className="inline-flex items-center space-x-1.5 text-sm text-white/40 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 2 ? (
              <motion.button type="button" onClick={nextStep} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-600/25 text-sm">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-600/25 text-sm disabled:opacity-50">
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create My Business'}</span>
              </motion.button>
            )}
          </div>
        </form>
      </div>

      {/* Login link */}
      <p className="text-center text-xs text-white/30 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
          Sign in
        </Link>
      </p>
    </div>
  );
}
