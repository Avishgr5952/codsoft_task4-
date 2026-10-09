'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { ProductCard } from '../components/product-card';
import { Product, Category, Vendor } from '../types';
import { api } from '../lib/api';
import {
  ArrowRight,
  Sparkles,
  Percent,
  TrendingUp,
  Store,
  ShieldCheck,
  ChevronRight,
  Tag,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealsProducts, setDealsProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [catsRes, featRes, dealsRes, recRes, vendorsRes] = await Promise.all([
          api.categories.getAll(),
          api.products.getFeatured(),
          api.products.getDeals(),
          api.products.getAll({ limit: 8, sort: 'newest' }),
          api.vendors.getAllAdmin({ status: 'APPROVED', limit: 4 }),
        ]);

        if (Array.isArray(catsRes)) setCategories(catsRes);
        if (Array.isArray(featRes)) setFeaturedProducts(featRes);
        if (Array.isArray(dealsRes)) setDealsProducts(dealsRes);
        if (recRes?.products) setRecentProducts(recRes.products);
        if (vendorsRes?.vendors) setTopVendors(vendorsRes.vendors);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white py-16 lg:py-24">
          {/* Decorative blur circles */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Premier Multi-Vendor Marketplace</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Discover Quality Goods From{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                    Independent Sellers
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Shop thousands of curated products from vetted merchants. Enjoy multi-vendor checkout, instant order tracking, and reliable delivery.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/shop"
                    className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/auth/register?role=VENDOR"
                    className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm font-semibold transition"
                  >
                    Become a Vendor
                  </Link>
                </div>

                {/* Trust stats */}
                <div className="pt-6 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 border-t border-white/10">
                  <div>
                    <p className="text-2xl font-black text-white">100%</p>
                    <p className="text-xs text-slate-400">Verified Vendors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">Multi-Store</p>
                    <p className="text-xs text-slate-400">Unified Cart</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">Real-Time</p>
                    <p className="text-xs text-slate-400">Live Delivery</p>
                  </div>
                </div>
              </div>

              {/* Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl p-3 bg-gradient-to-tr from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80"
                    alt="MarketHub Marketplace Showcase"
                    className="rounded-2xl object-cover h-[380px] w-full"
                  />
                  <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Buyer Protection</p>
                      <p className="text-[11px] text-gray-500">Every vendor order insured</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Carousel/Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Categories</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Shop by Department</h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              All Categories <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group relative rounded-2xl bg-white border border-gray-100 p-4 hover:border-blue-200 hover:shadow-lg transition flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50/80 mb-3 flex items-center justify-center overflow-hidden group-hover:scale-110 transition duration-300">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Tag className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {cat._count?.products || 0} Products
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Curated</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Featured Marketplace Items</h2>
            </div>
            <Link
              href="/shop?sort=popular"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              View More <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-gray-200/70 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Hot Deals & Promotions Banner Section */}
        {dealsProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" /> Limited Time Offers
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black">Vendor Discounts & Promotions</h3>
                  <p className="text-xs sm:text-sm text-pink-100 max-w-lg">
                    Direct discounts sponsored by top marketplace sellers. Use coupon code <span className="font-bold underline">WELCOME10</span> at checkout for extra savings!
                  </p>
                </div>
                <Link
                  href="/shop?deals=true"
                  className="px-6 py-3 bg-white text-rose-600 hover:bg-pink-50 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition flex-shrink-0"
                >
                  Shop Deals Now
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {dealsProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Top Vendors Showcase */}
        {topVendors.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Verified Sellers</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">Featured Stores & Brands</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                      {vendor.logoUrl ? (
                        <img src={vendor.logoUrl} alt={vendor.storeName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 bg-amber-50">
                          <Store className="w-6 h-6 text-amber-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{vendor.storeName}</h4>
                      <p className="text-xs text-gray-600">{vendor.city}, {vendor.country || 'USA'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                        Verified Seller
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-4">
                    {vendor.description || 'Quality curated products on MarketHub.'}
                  </p>

                  <Link
                    href={`/shop?vendorSlug=${vendor.slug}`}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl text-center border border-slate-200 transition"
                  >
                    Visit Store
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">New Arrivals</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Recently Added to MarketHub</h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              Browse All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
