import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Headphones, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Fast Verified Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Reliable local & national delivery partners</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Multi-Vendor Protection</h4>
              <p className="text-xs text-slate-400 mt-0.5">Every vendor is manually vetted & verified</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">30-day money-back satisfaction guarantee</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Round-the-clock assistance & resolution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Market<span className="text-blue-500">Hub</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed mt-4 max-w-sm">
            MarketHub is the next-generation multi-vendor e-commerce marketplace connecting verified independent merchants, artisanal brands, and tech innovators with shoppers worldwide.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            System Online & Connected (PostgreSQL + Redis + NestJS)
          </div>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Marketplace</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/shop" className="hover:text-white transition">All Products</Link></li>
            <li><Link href="/shop?sort=popular" className="hover:text-white transition">Popular Items</Link></li>
            <li><Link href="/shop?deals=true" className="hover:text-white transition">Hot Deals</Link></li>
            <li><Link href="/compare" className="hover:text-white transition">Product Comparison</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Vendors & Partners</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/auth/register" className="hover:text-white transition">Become a Seller</Link></li>
            <li><Link href="/vendor/dashboard" className="hover:text-white transition">Vendor Portal</Link></li>
            <li><Link href="/delivery/dashboard" className="hover:text-white transition">Delivery Partner Portal</Link></li>
            <li><Link href="/admin/dashboard" className="hover:text-white transition">Admin Management</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Customer Care</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/orders" className="hover:text-white transition">Track Your Order</Link></li>
            <li><Link href="/profile" className="hover:text-white transition">Account Settings</Link></li>
            <li><Link href="/wishlist" className="hover:text-white transition">Saved Wishlist</Link></li>
            <li><Link href="/cart" className="hover:text-white transition">Shopping Cart</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>© 2026 MarketHub Multi-Vendor Marketplace. Developed with NestJS, Next.js, and PostgreSQL.</p>
      </div>
    </footer>
  );
}
