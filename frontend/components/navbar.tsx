'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';
import { useCompare } from '../context/compare-context';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  Scale,
  Search,
  User as UserIcon,
  Store,
  Shield,
  Truck,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { api } from '../lib/api';
import { NotificationItem } from '../types';

export function Navbar() {
  const router = useRouter();
  const { user, logout, quickLogin } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { compareItems } = useCompare();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.notifications.getAll()
        .then((items: any) => {
          if (Array.isArray(items)) {
            setNotifications(items.slice(0, 5));
          }
        })
        .catch(() => {});

      api.notifications.getUnreadCount()
        .then((res: any) => {
          if (res?.unreadCount !== undefined) {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/shop');
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (user && unreadCount > 0) {
      await api.notifications.markAllAsRead().catch(() => {});
      setUnreadCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      {/* Top Demo Helper Bar for internship demonstration */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">MarketHub Multi-Vendor System</span>
            <span className="hidden sm:inline text-slate-400">| Complete Live Demo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Switch Demo Role:</span>
            <button
              onClick={() => quickLogin('CUSTOMER')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.role === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => quickLogin('VENDOR')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.role === 'VENDOR' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              Vendor
            </button>
            <button
              onClick={() => quickLogin('ADMIN')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.role === 'ADMIN' ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('DELIVERY_PARTNER')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                user?.role === 'DELIVERY_PARTNER' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              Delivery
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-blue-600 transition">
                Market<span className="text-blue-600">Hub</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-gray-600 font-semibold -mt-1">
                Multi-Vendor
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-10 pr-24 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
            <Search className="w-4 h-4 text-gray-600 absolute left-3.5 top-3" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/shop" className="hover:text-blue-600 transition">Shop</Link>
            <Link href="/shop?sort=popular" className="hover:text-blue-600 transition">Featured</Link>
            <Link href="/shop?deals=true" className="hover:text-blue-600 text-rose-600 font-semibold transition">Deals %</Link>
            <Link href="/compare" className="flex items-center gap-1 hover:text-blue-600 transition">
              <span>Compare</span>
              {compareItems.length > 0 && (
                <span className="w-4 h-4 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {compareItems.length}
                </span>
              )}
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-600 hover:text-rose-600 hover:bg-gray-100 rounded-full transition"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    handleMarkNotificationsRead();
                  }}
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notifications</span>
                      <span className="text-[11px] text-gray-600">{notifications.length} recent</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-600">No new notifications</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-gray-50 transition text-left">
                            <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                            <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Dashboard Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                    {user.firstName[0]}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.firstName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                </button>

                {profileOpen && (
                  <div
                    onClick={() => setProfileOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-[11px] text-gray-600 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                        {user.role}
                      </span>
                    </div>

                    {/* Role-Specific Dashboard Links */}
                    {user.role === 'VENDOR' && (
                      <Link
                        href="/vendor/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
                      >
                        <Store className="w-4 h-4 text-amber-600" />
                        Vendor Dashboard
                      </Link>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
                      >
                        <Shield className="w-4 h-4 text-rose-600" />
                        Admin Dashboard
                      </Link>
                    )}

                    {user.role === 'DELIVERY_PARTNER' && (
                      <Link
                        href="/delivery/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <Truck className="w-4 h-4 text-emerald-600" />
                        Delivery Dashboard
                      </Link>
                    )}

                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-gray-600" />
                      My Orders
                    </Link>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                    >
                      <UserIcon className="w-4 h-4 text-gray-600" />
                      Profile & Addresses
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 space-y-3">
            <form onSubmit={handleSearch} className="flex relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-20 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
              <Search className="w-4 h-4 text-gray-600 absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 text-xs bg-blue-600 text-white rounded-md"
              >
                Go
              </button>
            </form>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <Link href="/shop" className="p-2 hover:bg-gray-50 rounded-lg">Shop Catalog</Link>
              <Link href="/shop?deals=true" className="p-2 hover:bg-gray-50 rounded-lg text-rose-600">Deals & Offers</Link>
              <Link href="/compare" className="p-2 hover:bg-gray-50 rounded-lg">Compare Products</Link>
              <Link href="/wishlist" className="p-2 hover:bg-gray-50 rounded-lg">My Wishlist</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
