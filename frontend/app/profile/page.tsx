'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage('');
    try {
      await api.users.updateProfile({ firstName, lastName, phone });
      await refreshUser();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Error updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
          <p className="text-xs text-gray-500 mt-2">Sign in to view and update your profile.</p>
          <Link href="/auth/login" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Sign In Now
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
          Account Profile & Settings
        </h1>
        <p className="text-xs text-gray-500 mb-8">
          Manage your personal details, role access, and delivery settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Account Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-2xl font-black rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              {user.firstName[0]}
            </div>

            <div>
              <h2 className="font-bold text-base text-gray-900">{user.firstName} {user.lastName}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>

            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                Role: {user.role}
              </span>
            </div>

            {/* Quick dashboard shortcuts */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-left">
              {user.role === 'VENDOR' && (
                <Link
                  href="/vendor/dashboard"
                  className="flex items-center gap-2 p-2.5 bg-amber-50 text-amber-900 font-bold rounded-xl hover:bg-amber-100 transition"
                >
                  <Store className="w-4 h-4 text-amber-600" /> Go to Vendor Dashboard
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 p-2.5 bg-rose-50 text-rose-900 font-bold rounded-xl hover:bg-rose-100 transition"
                >
                  <Shield className="w-4 h-4 text-rose-600" /> Go to Admin Dashboard
                </Link>
              )}
              {user.role === 'DELIVERY_PARTNER' && (
                <Link
                  href="/delivery/dashboard"
                  className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 font-bold rounded-xl hover:bg-emerald-100 transition"
                >
                  <Truck className="w-4 h-4 text-emerald-600" /> Go to Delivery Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Personal Information
            </h3>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">Email cannot be changed directly</span>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-40"
              >
                {isUpdating ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
