'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { useAuth } from '../../context/auth-context';
import { useCart } from '../../context/cart-context';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Store,
  Tag,
  ArrowRight,
  Truck,
  Lock,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();

  const [address, setAddress] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    addressLine1: '742 Evergreen Terrace',
    addressLine2: 'Apt 4B',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'USA',
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'MOCK_CARD' | 'MOCK_PAYPAL' | 'MOCK_COD'>('MOCK_CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName} ${user.lastName}`,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const vendorGroups = cart?.vendorGroups || [];
  const baseSubtotal = cart?.summary?.subtotal || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotalAfterDiscount = Math.max(0, baseSubtotal - discountAmount);
  const tax = parseFloat((subtotalAfterDiscount * 0.05).toFixed(2));
  const shipping = vendorGroups.length > 0 ? 10.0 : 0.0;
  const grandTotal = parseFloat((subtotalAfterDiscount + tax + shipping).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res: any = await api.coupons.validate({
        code: couponCode.trim(),
        cartSubtotal: baseSubtotal,
      });
      setAppliedCoupon(res);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.addressLine1 || !address.city || !address.postalCode) {
      alert('Please fill in complete shipping address information.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdOrder: any = await api.orders.create({
        shippingAddress: address,
        billingAddress: address,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentMethod,
      });

      await refreshCart();
      setOrderComplete(createdOrder);
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was just placed, display Order Confirmation Screen
  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Payment & Order Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                Thank you for your order!
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Your payment was processed successfully. Order number:
              </p>
              <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-xl font-mono font-bold text-blue-700 text-sm">
                #{orderComplete.orderNumber}
              </div>
            </div>

            {/* Order breakdown */}
            <div className="bg-gray-50 rounded-2xl p-6 text-left text-xs space-y-3">
              <div className="flex justify-between font-semibold text-gray-600">
                <span>Shipping Destination:</span>
                <span className="text-gray-900 font-bold">{orderComplete.shippingAddress?.fullName}, {orderComplete.shippingAddress?.city}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-600">
                <span>Payment Status:</span>
                <span className="text-emerald-600 font-bold">PAID (Mock Gateway Txn #{orderComplete.payment?.transactionId})</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-600">
                <span>Total Charged:</span>
                <span className="text-gray-900 font-extrabold text-sm">{formatPrice(orderComplete.total)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-600">
                <span>Fulfilling Vendors:</span>
                <span className="text-blue-600 font-bold">{orderComplete.vendorOrders?.length || 1} independent store(s)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href={`/orders/${orderComplete.id}`}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
              >
                Track Live Order Status
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Address, Payment */}
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  1. Delivery Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-gray-700 block mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-gray-700 block mb-1">Apartment, Suite (Optional)</label>
                  <input
                    type="text"
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Postal / Zip Code</label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    2. Payment Method
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted
                </span>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOCK_CARD')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition ${
                    paymentMethod === 'MOCK_CARD'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Credit / Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOCK_PAYPAL')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition ${
                    paymentMethod === 'MOCK_PAYPAL'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  PayPal Instant
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOCK_COD')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition ${
                    paymentMethod === 'MOCK_COD'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cash on Delivery
                </button>
              </div>

              {/* Mock Credit Card Inputs */}
              {paymentMethod === 'MOCK_CARD' && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Card Number (Mock Demo)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Security CVC</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    * Internship demo payment gateway. No real credit card charges are made.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Items Review, Coupon, Totals */}
          <div className="lg:col-span-4 space-y-6">
            {/* Vendor Breakdown Review */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
                Vendor Packages Review
              </h3>

              <div className="space-y-4">
                {vendorGroups.map((group) => (
                  <div key={group.vendorId} className="p-3 bg-gray-50 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>{group.storeName}</span>
                    </div>
                    <div className="space-y-1 pl-5 text-[11px] text-gray-600">
                      {group.items.map((i) => (
                        <div key={i.id} className="flex justify-between">
                          <span className="truncate max-w-[170px]">{i.name} (x{i.quantity})</span>
                          <span className="font-semibold">{formatPrice(i.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Apply Coupon / Promo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl uppercase font-mono font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center justify-between">
                    <span>Coupon {appliedCoupon.code} applied! (-{formatPrice(appliedCoupon.discountAmount)})</span>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-emerald-900">Remove</button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">{couponError}</p>
                )}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(baseSubtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">{formatPrice(shipping)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-black text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-blue-600">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || vendorGroups.length === 0}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>{isSubmitting ? 'Processing Payment...' : `Pay ${formatPrice(grandTotal)} & Place Order`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-[10px] text-gray-400">
                Single instant payment securely splits across all corresponding stores.
              </div>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
