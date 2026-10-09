'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/navbar';
import { Footer } from '../../../components/footer';
import { ProductCard } from '../../../components/product-card';
import { Product, Category } from '../../../types';
import { api } from '../../../lib/api';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CategoryProductsPage() {
  const { category } = useParams();
  const [catData, setCatData] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      if (!category) return;
      setLoading(true);
      try {
        const [c, p]: any = await Promise.all([
          api.categories.getBySlug(category as string),
          api.products.getAll({ category: category as string, limit: 24 }),
        ]);
        setCatData(c);
        if (p?.products) setProducts(p.products);
      } catch (err) {
        console.error('Failed to load category products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [category]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-blue-600">Categories</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{catData?.name || category}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-black">{catData?.name || 'Category Products'}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
            {catData?.description || 'Explore top rated items from verified marketplace sellers in this department.'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200/70 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <h3 className="text-base font-bold text-gray-900">No products in this category yet</h3>
            <p className="text-xs text-gray-500 mt-1">Check back soon as our vendors add new catalog items.</p>
            <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
