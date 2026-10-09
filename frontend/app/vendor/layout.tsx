'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  Store,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Tag,
  Settings,
  ExternalLink,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [storeStatus, setStoreStatus] = useState<string>('APPROVED');
  const [storeSlug, setStoreSlug] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'VENDOR') {
      api.vendors.getProfile()
        .then((v: any) => {
          if (v) {
            setStoreStatus(v.status);
            setStoreSlug(v.slug);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-500">Loading Vendor Portal...</div>;
  }

  if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Vendor Access Required</h2>
          <p className="text-xs text-gray-500">
            This dashboard is reserved for authorized vendor merchant accounts.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <NextLink href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
              Return Home
            </NextLink>
            <NextLink href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
              Sign In As Vendor
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/vendor/products', icon: Package },
    { label: 'Inventory', href: '/vendor/inventory', icon: Boxes },
    { label: 'Orders', href: '/vendor/orders', icon: ShoppingBag },
    { label: 'Promotions', href: '/vendor/promotions', icon: Tag },
    { label: 'Store Settings', href: '/vendor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/70">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 flex-shrink-0 border-r border-slate-800">
        <div className="space-y-6">
          {/* Logo & Store Info */}
          <div className="px-3 py-2">
            <NextLink href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-white">Vendor Portal</span>
                <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider -mt-0.5">
                  MarketHub
                </span>
              </div>
            </NextLink>

            <div className="mt-4 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
              <p className="text-xs font-bold text-white truncate">{user.vendorProfile?.storeName || `${user.firstName}'s Store`}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    storeStatus === 'APPROVED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Status: {storeStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <NextLink
            href={storeSlug ? `/shop?vendorSlug=${storeSlug}` : '/shop'}
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2"><ExternalLink className="w-4 h-4" /> View Public Store</span>
          </NextLink>

          <NextLink
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Marketplace Home
          </NextLink>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              {navItems.find((n) => n.href === pathname)?.label || 'Merchant Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-gray-600">Merchant: {user.firstName} {user.lastName}</span>
            <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
              {user.firstName[0]}
            </div>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
