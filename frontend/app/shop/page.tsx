'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { ProductCard } from '../../components/product-card';
import { Product, Category, Vendor } from '../../types';
import { api } from '../../lib/api';
import {
  Filter,
  Search,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get('vendorId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load filter options (categories & vendors)
  useEffect(() => {
    Promise.all([
      api.categories.getAll(),
      api.vendors.getAllAdmin({ status: 'APPROVED', limit: 20 }),
    ]).then(([cats, vends]: any) => {
      if (Array.isArray(cats)) setCategories(cats);
      if (vends?.vendors) setVendors(vends.vendors);
    });
  }, []);

  // Fetch products whenever filters or page change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: 12,
          sort,
        };
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedVendor) params.vendorId = selectedVendor;
        if (minPrice) params.minPrice = Number(minPrice);
        if (maxPrice) params.maxPrice = Number(maxPrice);
        if (minRating) params.minRating = Number(minRating);

        const res: any = await api.products.getAll(params);
        if (res?.products) {
          setProducts(res.products);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [search, selectedCategory, selectedVendor, minPrice, maxPrice, minRating, sort, currentPage]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedVendor('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSort('newest');
    setCurrentPage(1);
    router.push('/shop');
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(selectedVendor) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(minRating);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Marketplace Catalog</h1>
            <p className="text-xs text-gray-500 mt-1">
              Showing {pagination.total} products from verified independent vendors
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">Sort:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Keyword: "{search}"
                <button onClick={() => setSearch('')}><X className="w-3 h-3 hover:text-blue-900" /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Category: {categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name || selectedCategory}
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 hover:text-blue-900" /></button>
              </span>
            )}
            {selectedVendor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Vendor: {vendors.find((v) => v.id === selectedVendor)?.storeName || selectedVendor}
                <button onClick={() => setSelectedVendor('')}><X className="w-3 h-3 hover:text-blue-900" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Price: ${minPrice || '0'} - ${maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {minRating && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {minRating}+ Stars
                <button onClick={() => setMinRating('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 ml-auto"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`${
              mobileFilterOpen ? 'block fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto' : 'hidden lg:block'
            }`}
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center lg:hidden pb-4 border-b">
                <h3 className="font-bold text-sm">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5" /></button>
              </div>

              {/* Search Within Filter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Keywords, SKU..."
                    className="w-full text-xs px-3 py-2 pl-8 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Category</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                      !selectedCategory ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCategory(c.slug); setCurrentPage(1); }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium flex justify-between items-center transition ${
                        selectedCategory === c.slug ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-gray-400">({c._count?.products || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Price Range ($)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Vendor Filter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Stores & Vendors</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => { setSelectedVendor(''); setCurrentPage(1); }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                      !selectedVendor ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Vendors
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVendor(v.id); setCurrentPage(1); }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium truncate transition ${
                        selectedVendor === v.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {v.storeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Minimum Rating</label>
                <div className="space-y-1">
                  {[4, 3, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMinRating(minRating === String(r) ? '' : String(r)); setCurrentPage(1); }}
                      className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                        minRating === String(r) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex text-amber-400">
                        {Array.from({ length: r }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span>& Up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-gray-200/70 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-900">No products found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your filters, clearing your search query, or checking another category.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: pagination.totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                          currentPage === idx + 1
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={currentPage >= pagination.totalPages}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Marketplace Catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
