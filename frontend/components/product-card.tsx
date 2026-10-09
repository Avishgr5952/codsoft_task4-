'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '../types';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';
import { useCompare } from '../context/compare-context';
import { formatPrice } from '../lib/utils';
import { Star, ShoppingCart, Heart, Scale, Check, Store } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);
  const availableStock = product.inventory?.availableQuantity ?? 0;
  const isOutOfStock = availableStock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.discount && product.discount > 0 && (
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white bg-rose-600 rounded-full shadow-sm">
            -{Math.round(product.discount)}%
          </span>
        )}
        {product.isFeatured && (
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 bg-blue-50 border border-blue-200/50 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Action Overlay Buttons */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleToggleWishlist}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
            inWishlist
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 text-gray-700 hover:text-rose-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleToggleCompare}
          title={inCompare ? 'Remove from Compare' : 'Add to Compare'}
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
            inCompare
              ? 'bg-blue-600 text-white'
              : 'bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white'
          }`}
        >
          <Scale className="w-4 h-4" />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/products/${product.slug || product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-white text-gray-900 text-xs font-bold rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Tag */}
          {product.vendor && (
            <Link
              href={`/shop?vendorId=${product.vendor.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-blue-600 mb-1.5 transition"
            >
              <Store className="w-3 h-3 text-gray-600" />
              <span>{product.vendor.storeName}</span>
            </Link>
          )}

          {/* Product Title */}
          <Link
            href={`/products/${product.slug || product.id}`}
            className="block text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 transition mb-2"
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-gray-800">
              {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
            </span>
            <span className="text-[11px] text-gray-600">
              ({product.reviewCount})
            </span>
          </div>
        </div>

        <div>
          {/* Price & Stock */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-gray-600 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isOutOfStock
                  ? 'text-rose-500'
                  : availableStock <= 5
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {isOutOfStock
                ? 'Out of stock'
                : availableStock <= 5
                ? `Only ${availableStock} left`
                : 'In stock'}
            </span>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
