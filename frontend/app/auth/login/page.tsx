'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck, Store, Truck, User } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const { login, quickLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'VENDOR') {
        router.push('/vendor/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DELIVERY_PARTNER') {
        router.push('/delivery/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'DELIVERY_PARTNER') => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLogin(role);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'VENDOR') {
        router.push('/vendor/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DELIVERY_PARTNER') {
        router.push('/delivery/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Market<span className="text-blue-600">Hub</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-gray-500 mt-1">Enter your credentials or use the instant demo roles below.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Switcher Card */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-md">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-center">
            One-Click Internship Demo Logins:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('CUSTOMER')}
              type="button"
              className="p-2 bg-slate-800 hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5" /> Customer
            </button>
            <button
              onClick={() => handleQuickLogin('VENDOR')}
              type="button"
              className="p-2 bg-slate-800 hover:bg-amber-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Store className="w-3.5 h-3.5" /> Vendor
            </button>
            <button
              onClick={() => handleQuickLogin('ADMIN')}
              type="button"
              className="p-2 bg-slate-800 hover:bg-rose-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </button>
            <button
              onClick={() => handleQuickLogin('DELIVERY_PARTNER')}
              type="button"
              className="p-2 bg-slate-800 hover:bg-emerald-600 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Truck className="w-3.5 h-3.5" /> Delivery Partner
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-gray-100">
          {error && (
            <div className="p-3 mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-bold text-gray-700">Password</label>
                <Link href="/auth/forgot-password" className="text-[11px] font-bold text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            Don't have an account yet?{' '}
            <Link href="/auth/register" className="font-bold text-blue-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-400">Loading sign-in...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
