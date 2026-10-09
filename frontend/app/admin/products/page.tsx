'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import {
  Package,
  Search,
  Star,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const [prodRes, catRes]: [any, any] = await Promise.all([
        api.products.getAll(params),
        api.categories.getAll(),
      ]);

      setProducts(prodRes?.products || []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleFeatured = async (product: any) => {
    try {
      setActionLoading(product.id);
      await api.products.update(product.id, { isFeatured: !product.isFeatured });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update feature status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePublished = async (product: any) => {
    try {
      setActionLoading(product.id);
      await api.products.update(product.id, { isPublished: !product.isPublished });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update publish status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;

    try {
      setActionLoading(product.id);
      await api.products.delete(product.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Marketplace Catalog Oversight</h2>
          <p className="text-xs text-gray-500 mt-1">
            Audit seller catalog listings, promote top goods to featured storefront banners, or remove non-compliant items.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
            Loading catalog products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No products found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">Product & Image</th>
                  <th className="py-4 px-6">Vendor / Store</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Featured</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {products.map((product) => {
                  const image = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  const stock = product.inventory?.availableQuantity ?? 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition">
                      {/* Product */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={image}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0 border border-gray-200"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-gray-900 block truncate">{product.title}</span>
                            <span className="text-[11px] text-gray-400 block font-mono">
                              SKU: {product.sku || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-4 px-6 font-semibold text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-gray-400" />
                          <span>{product.vendor?.storeName || 'Marketplace'}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 text-gray-600">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[11px] font-semibold">
                          {product.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-black text-gray-900">
                        {formatPrice(product.price)}
                        {product.discount > 0 && (
                          <span className="ml-1 text-[10px] text-rose-500 font-bold block">
                            -{product.discount}% off
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-6">
                        <span
                          className={`font-bold ${
                            stock <= 5 ? 'text-amber-600' : 'text-gray-700'
                          }`}
                        >
                          {stock} in stock
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleFeatured(product)}
                          disabled={actionLoading === product.id}
                          className={`p-1.5 rounded-xl transition ${
                            product.isFeatured
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-400 hover:text-amber-500'
                          }`}
                          title={product.isFeatured ? 'Featured on Homepage' : 'Promote to Featured'}
                        >
                          <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>

                      {/* Published Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleTogglePublished(product)}
                          disabled={actionLoading === product.id}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                            product.isPublished
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {product.isPublished ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Published
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                            title="View Storefront Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={actionLoading === product.id}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Remove Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
