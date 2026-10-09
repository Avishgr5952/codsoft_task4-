'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { useWishlist } from '../../context/wishlist-context';
import { useCart } from '../../context/cart-context';
import { formatPrice } from '../../lib/utils';
import { Heart, ShoppingCart, Trash2, Store, Star } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500 fill-current" />
              My Saved Wishlist
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {wishlist.length} saved item(s) to purchase later
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your wishlist is empty</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
              Save products while browsing so you can easily track and purchase them whenever you are ready.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-rose-500 hover:text-white rounded-full text-gray-500 shadow transition"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    {product.vendor && (
                      <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                        <Store className="w-3 h-3 text-amber-600" />
                        {product.vendor.storeName}
                      </span>
                    )}

                    <Link
                      href={`/products/${product.slug || product.id}`}
                      className="font-bold text-xs text-gray-900 hover:text-blue-600 line-clamp-2"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span className="font-bold">{product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}</span>
                      <span className="text-gray-400">({product.reviewCount})</span>
                    </div>

                    <div className="font-black text-sm text-gray-900 pt-1">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      addToCart(product.id, 1);
                      removeFromWishlist(product.id);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
