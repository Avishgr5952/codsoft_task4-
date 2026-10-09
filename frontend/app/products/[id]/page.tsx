'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../components/navbar';
import { Footer } from '../../../components/footer';
import { Product, Review } from '../../../types';
import { api } from '../../../lib/api';
import { useCart } from '../../../context/cart-context';
import { useWishlist } from '../../../context/wishlist-context';
import { useCompare } from '../../../context/compare-context';
import { useAuth } from '../../../context/auth-context';
import { formatPrice, formatDate } from '../../../lib/utils';
import {
  Star,
  ShoppingCart,
  Heart,
  Scale,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  Check,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Review submission state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const data: any = await api.products.getByIdOrSlug(id as string);
        setProduct(data);
        if (data.images && data.images.length > 0) {
          const primary = data.images.find((img: any) => img.isPrimary);
          setSelectedImage(primary ? primary.url : data.images[0].url);
        }

        // Fetch reviews
        const revs: any = await api.reviews.getByProduct(data.id);
        if (Array.isArray(revs)) {
          setReviews(revs);
        }

        // Check if current user is eligible to review
        if (user) {
          const elig: any = await api.reviews.checkEligibility(data.id).catch(() => ({ canReview: false }));
          setCanReview(Boolean(elig?.canReview && !elig?.alreadyReviewed));
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">The product you are looking for does not exist or has been removed.</p>
          <Link href="/shop" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Back to Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const availableStock = product.inventory?.availableQuantity ?? 0;
  const isOutOfStock = availableStock <= 0;
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Error adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, quantity);
    router.push('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const newReview: any = await api.reviews.create({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      setReviews([newReview, ...reviews]);
      setCanReview(false);
      setReviewComment('');
      setReviewTitle('');
      setReviewMsg('Thank you! Your verified purchase review has been posted.');
    } catch (err: any) {
      setReviewMsg(err.message || 'Could not post review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-blue-600">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-blue-600">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.discount && product.discount > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full shadow">
                  -{Math.round(product.discount)}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImage === img.url ? 'border-blue-600 shadow-md scale-95' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Buy Box */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Vendor Badge */}
              {product.vendor && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/shop?vendorSlug=${product.vendor.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                  >
                    <Store className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sold by {product.vendor.storeName}</span>
                  </Link>
                  <span className="text-[11px] text-gray-600">SKU: {product.sku}</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug tracking-tight">
                {product.name}
              </h1>

              {/* Rating & Review summary */}
              <div className="flex items-center gap-3">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.averageRating) ? 'fill-current' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'No ratings yet'}
                </span>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount} customer reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 py-3 border-y border-gray-100">
                <span className="text-3xl font-black text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-base text-gray-600 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
                <span
                  className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
                    isOutOfStock
                      ? 'bg-red-50 text-red-600'
                      : availableStock <= 5
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : availableStock <= 5
                    ? `Only ${availableStock} units remaining!`
                    : `In Stock (${availableStock} units)`}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-bold text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-gray-900 bg-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-gray-500">Max {availableStock}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isAdding}
                    className={`flex-1 py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                      isOutOfStock
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : addedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 py-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white disabled:opacity-40 transition shadow-sm"
                  >
                    Buy Now
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 transition"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-rose-500' : ''}`} />
                    <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                  </button>

                  <button
                    onClick={() => (inCompare ? removeFromCompare(product.id) : addToCompare(product))}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition"
                  >
                    <Scale className={`w-4 h-4 ${inCompare ? 'text-blue-600' : ''}`} />
                    <span>{inCompare ? 'In Comparison' : 'Compare Product'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Marketplace Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-gray-100 text-center">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-800">Dispatch</p>
                <p className="text-[9px] text-gray-500">24-48 Hours</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-800">Authentic</p>
                <p className="text-[9px] text-gray-500">100% Verified</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <RotateCcw className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-gray-800">Easy Returns</p>
                <p className="text-[9px] text-gray-500">30 Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Table */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.specifications.map((spec) => (
                <div key={spec.id} className="flex justify-between py-2 border-b border-gray-100 text-xs">
                  <span className="font-semibold text-gray-500">{spec.key}</span>
                  <span className="font-bold text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verified Customer Reviews Section */}
        <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Verified Customer Reviews ({reviews.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Only authenticated customers with confirmed delivered orders can leave reviews.
              </p>
            </div>

            {canReview && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                Eligible to review this item
              </span>
            )}
          </div>

          {/* Write Review Form (if eligible) */}
          {canReview && (
            <form onSubmit={handleReviewSubmit} className="mb-10 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
              <h4 className="text-sm font-bold text-gray-900">Write Your Verified Review</h4>
              
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Your Rating</label>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-700 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="e.g. Outstanding quality and battery life!"
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Your Review Feedback</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience with this product..."
                  className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              {reviewMsg && <p className="text-xs font-semibold text-blue-700">{reviewMsg}</p>}

              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No reviews yet for this product. Be the first to purchase and review!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                        {rev.user?.firstName?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {rev.user?.firstName} {rev.user?.lastName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                          <Check className="w-2.5 h-2.5" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-600">{formatDate(rev.createdAt)}</span>
                  </div>

                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>

                  {rev.title && <p className="text-xs font-bold text-gray-900">{rev.title}</p>}
                  <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
