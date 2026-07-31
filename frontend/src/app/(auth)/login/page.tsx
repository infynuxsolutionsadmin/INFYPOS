'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { authService } from '../../../services/auth.service';
import { useAuth } from '../../../contexts/AuthContext';
import { Logo } from '../../../components/Logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { loginState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', tenantSlug: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res.data?.accessToken && res.data?.refreshToken) {
        loginState(res.data.accessToken, res.data.refreshToken);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition";
  const labelClass = "block text-xs font-medium text-white/40 mb-1.5";

  return (
    <div className="text-white">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex justify-center">
          <Logo height={36} />
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold">Welcome back</h2>
        <p className="text-sm text-white/40 mt-1">Sign in to your business dashboard</p>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className={labelClass}>Tenant Slug *</label>
            <input {...register('tenantSlug')} className={inputClass} placeholder="your-business-slug" />
            {errors.tenantSlug && <p className="text-red-400 text-[11px] mt-1">{errors.tenantSlug.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Email Address *</label>
            <input type="email" {...register('email')} className={inputClass} placeholder="admin@company.com" />
            {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} {...register('password')} className={inputClass} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-[11px] mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 text-white/30 cursor-pointer">
              <input type="checkbox" className="rounded border-white/20 bg-white/[0.04]" />
              <span>Remember me</span>
            </label>
            <button type="button" className="text-blue-400 hover:text-blue-300 transition font-medium">
              Forgot password?
            </button>
          </div>

          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-600/25 text-sm disabled:opacity-50">
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </motion.button>
        </form>
      </motion.div>

      {/* Register link */}
      <p className="text-center text-xs text-white/30 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
          Start free trial
        </Link>
      </p>
    </div>
  );
}
