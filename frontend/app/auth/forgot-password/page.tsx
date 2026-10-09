'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { api } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Error sending reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900">
            Market<span className="text-blue-600">Hub</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Reset your password</h2>
        <p className="text-xs text-gray-500 mt-1">We'll send password recovery instructions to your email.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-gray-100">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Recovery Instructions Sent</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                If an account with {email} exists, password reset instructions have been dispatched.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-2"
              >
                <ChevronLeft className="w-4 h-4" /> Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Registered Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Sending...' : 'Send Recovery Instructions'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link href="/auth/login" className="text-[11px] font-bold text-gray-500 hover:text-blue-600">
                  Remember password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
