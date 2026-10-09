'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { useCart } from '../../context/cart-context';
import { formatPrice } from '../../lib/utils';
import {
  Trash2,
  ShoppingCart,
  Store,
  ArrowRight,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();

  const vendorGroups = cart?.vendorGroups || [];
  const summary = cart?.summary || { subtotal: 0, tax: 0, shipping: 0, grandTotal: 0, totalItems: 0 };

  const hasOutOfStockItems = vendorGroups.some((vg) =>
    vg.items.some((item) => !item.isAvailable),
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
              Multi-Vendor Shopping Cart
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalItems} item(s) from {vendorGroups.length} store(s)
            </p>
          </div>

          {vendorGroups.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-red-600 hover:text-red-700 transition"
            >
              Clear Entire Cart
            </button>
          )}
        </div>

        {vendorGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your cart is currently empty</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
              Explore products from our verified vendors and add items to your unified multi-store cart.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Vendor-Grouped Items */}
            <div className="lg:col-span-8 space-y-6">
              {vendorGroups.map((group) => (
                <div
                  key={group.vendorId}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden"
                >
                  {/* Vendor Store Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/shop?vendorSlug=${group.slug}`}
                          className="font-bold text-xs sm:text-sm text-gray-900 hover:text-blue-600 transition"
                        >
                          {group.storeName}
                        </Link>
                        <p className="text-[10px] text-gray-400">Fulfilled directly by seller</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      Subtotal: {formatPrice(group.subtotal)}
                    </span>
                  </div>

                  {/* Vendor Product Items */}
                  <div className="divide-y divide-gray-100 space-y-4">
                    {group.items.map((item) => (
                      <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.slug || item.productId}`}
                            className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>

                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                              {formatPrice(item.price)}
                            </span>
                            {item.compareAtPrice && item.compareAtPrice > item.price && (
                              <span className="text-[11px] text-gray-400 line-through">
                                {formatPrice(item.compareAtPrice)}
                              </span>
                            )}
                          </div>

                          {!item.isAvailable && (
                            <p className="text-[11px] font-bold text-rose-600 mt-1">
                              Stock unavailable (Only {item.availableStock} in stock)
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={isLoading}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-gray-900 bg-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={isLoading || item.quantity >= item.availableStock}
                              className="p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-gray-900">
                              {formatPrice(item.totalPrice)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24 space-y-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({summary.totalItems} items)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(summary.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-gray-900">{formatPrice(summary.shipping)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-black text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-lg text-blue-600">{formatPrice(summary.grandTotal)}</span>
                </div>
              </div>

              {hasOutOfStockItems && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700">
                  Some items in your cart exceed available stock. Please reduce their quantities before checkout.
                </div>
              )}

              <button
                onClick={() => router.push('/checkout')}
                disabled={hasOutOfStockItems || vendorGroups.length === 0}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="space-y-2 pt-2 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Secure Multi-Vendor Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Single unified payment for all stores</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
