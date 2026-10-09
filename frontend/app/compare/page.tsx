'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { useCompare } from '../../context/compare-context';
import { useCart } from '../../context/cart-context';
import { formatPrice } from '../../lib/utils';
import { Trash2, ShoppingCart, Star, Scale, Store, Check, X } from 'lucide-react';

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  // Extract all unique specification keys across comparing products
  const specKeys = Array.from(
    new Set(
      compareItems.flatMap((p) => p.specifications?.map((s) => s.key) || []),
    ),
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Scale className="w-7 h-7 text-blue-600" />
              Side-by-Side Product Comparison
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Comparing {compareItems.length} product(s) (Maximum 4)
            </p>
          </div>

          {compareItems.length > 0 && (
            <button
              onClick={clearCompare}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Comparison
            </button>
          )}
        </div>

        {compareItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No products selected for comparison</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
              Browse the catalog and click the scale icon on any product to compare specifications, prices, and vendor details side-by-side.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
            >
              Explore Products to Compare
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <tbody>
                {/* Product Image & Title Row */}
                <tr className="border-b border-gray-100">
                  <td className="p-4 w-44 bg-gray-50/60 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Product
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 align-top w-64 border-l border-gray-100">
                      <div className="relative group">
                        <button
                          onClick={() => removeFromCompare(item.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-gray-100 hover:bg-red-500 hover:text-white rounded-full text-gray-500 transition shadow-sm"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                          <img
                            src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link
                          href={`/products/${item.slug || item.id}`}
                          className="font-bold text-xs text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-1">SKU: {item.sku}</p>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b border-gray-100">
                  <td className="p-4 bg-gray-50/60 font-bold text-xs text-gray-500">Price</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 font-black text-sm text-gray-900">
                      {formatPrice(item.price)}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b border-gray-100">
                  <td className="p-4 bg-gray-50/60 font-bold text-xs text-gray-500">Customer Rating</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="text-xs font-bold text-gray-900">
                          {item.averageRating > 0 ? item.averageRating.toFixed(1) : 'New'}
                        </span>
                        <span className="text-[11px] text-gray-400">({item.reviewCount})</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Vendor */}
                <tr className="border-b border-gray-100">
                  <td className="p-4 bg-gray-50/60 font-bold text-xs text-gray-500">Vendor / Store</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>{item.vendor?.storeName || 'MarketHub Seller'}</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Availability */}
                <tr className="border-b border-gray-100">
                  <td className="p-4 bg-gray-50/60 font-bold text-xs text-gray-500">Stock Availability</td>
                  {compareItems.map((item) => {
                    const stock = item.inventory?.availableQuantity ?? 0;
                    return (
                      <td key={item.id} className="p-4 border-l border-gray-100 text-xs font-semibold">
                        {stock > 0 ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> In Stock ({stock} units)
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Out of Stock
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Specifications Matrix */}
                {specKeys.map((key) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="p-4 bg-gray-50/60 font-medium text-xs text-gray-600">{key}</td>
                    {compareItems.map((item) => {
                      const spec = item.specifications?.find((s) => s.key.toLowerCase() === key.toLowerCase());
                      return (
                        <td key={item.id} className="p-4 border-l border-gray-100 text-xs text-gray-800">
                          {spec ? spec.value : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Action CTA Row */}
                <tr>
                  <td className="p-4 bg-gray-50/60 font-bold text-xs text-gray-500">Action</td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 border-l border-gray-100">
                      <button
                        onClick={() => addToCart(item.id, 1)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
