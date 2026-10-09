'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import {
  Shield,
  LayoutDashboard,
  Store,
  Layers,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-gray-500">Loading Admin Center...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Administrator Access Required</h2>
          <p className="text-xs text-gray-500">
            This management console requires full platform administrator credentials.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <NextLink href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
              Return Home
            </NextLink>
            <NextLink href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
              Sign In As Admin
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Vendor Approvals', href: '/admin/vendors', icon: Store },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Catalog Products', href: '/admin/products', icon: Package },
    { label: 'Orders Oversight', href: '/admin/orders', icon: ShoppingBag },
    { label: 'User Management', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50/70">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between p-4 flex-shrink-0 border-r border-slate-900">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <NextLink href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-white">Platform Admin</span>
                <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider -mt-0.5">
                  MarketHub
                </span>
              </div>
            </NextLink>
          </div>

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
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-900">
          <NextLink
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
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
              {navItems.find((n) => n.href === pathname)?.label || 'Administration Console'}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-full text-[10px]">
              SUPER ADMIN
            </span>
            <span className="font-semibold text-gray-600">{user.email}</span>
          </div>
        </header>

        <main className="p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
