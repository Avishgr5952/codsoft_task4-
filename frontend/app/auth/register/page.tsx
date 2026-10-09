'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/auth-context';
import { ShoppingBag, Lock, Mail, User, Phone, Store, ArrowRight } from 'lucide-react';
import { Role } from '../../../types';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as Role) || 'CUSTOMER';
  const { register } = useAuth();

  const [role, setRole] = useState<Role>(defaultRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password,
        role,
      };

      if (role === 'VENDOR') {
        payload.storeName = storeName;
        payload.storeDescription = storeDescription;
      }

      const user = await register(payload);
      if (user.role === 'VENDOR') {
        router.push('/vendor/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create your account</h2>
        <p className="text-xs text-gray-500 mt-1">Join as a shopper or open your independent marketplace store.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-gray-100">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`py-2 rounded-xl transition ${
                role === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Customer Account
            </button>
            <button
              type="button"
              onClick={() => setRole('VENDOR')}
              className={`py-2 rounded-xl transition ${
                role === 'VENDOR' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vendor / Seller
            </button>
          </div>

          {error && (
            <div className="p-3 mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Vendor Specific Inputs */}
            {role === 'VENDOR' && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Store / Business Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Acme Artisan Goods"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                    <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Store Description</label>
                  <textarea
                    rows={2}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Tell shoppers about your store and products..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                role === 'VENDOR' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              <span>{loading ? 'Creating Account...' : role === 'VENDOR' ? 'Register As Vendor' : 'Create Customer Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-400">Loading registration...</div>}>
      <RegisterForm />
    </React.Suspense>
  );
}
