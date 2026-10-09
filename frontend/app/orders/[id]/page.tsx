'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../components/navbar';
import { Footer } from '../../../components/footer';
import { Order } from '../../../types';
import { api } from '../../../lib/api';
import { formatPrice, formatDate } from '../../../lib/utils';
import {
  Package,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const data: any = await api.orders.getById(id as string);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Could not load order details');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading order tracking...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">{error || 'This order does not exist or you do not have permission to view it.'}</p>
          <Link href="/orders" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Back to Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Order status steps
  const steps = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.status);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition mb-3">
            <ChevronLeft className="w-4 h-4" /> Back to All Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                Status: {order.status.replace(/_/g, ' ')}
              </span>
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Status Stepper Tracker */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">Delivery Progress</h3>
            <div className="grid grid-cols-5 gap-2 relative">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div key={step} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isPassed
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] mt-2 font-bold ${isCurrent ? 'text-blue-600 font-extrabold' : 'text-gray-500'}`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vendor packages and items */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Packages by Seller ({order.vendorOrders?.length || 1})
            </h3>

            {order.vendorOrders?.map((vo) => (
              <div key={vo.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-gray-900">{vo.vendor?.storeName || 'Vendor Package'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded-full">
                      Package Status: {vo.status}
                    </span>
                    {vo.trackingNumber && (
                      <span className="font-mono text-blue-600 font-bold">
                        Tracking: {vo.trackingNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this vendor order */}
                <div className="divide-y divide-gray-100 space-y-3">
                  {order.orderItems
                    ?.filter((item) => item.vendorOrderId === vo.id || !item.vendorOrderId)
                    .map((item) => (
                      <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                            <img
                              src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <Link href={`/products/${item.product?.slug || item.productId}`} className="font-bold text-gray-900 hover:text-blue-600">
                              {item.productName}
                            </Link>
                            <p className="text-[11px] text-gray-400">SKU: {item.productSku} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Addresses, Payment Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Destination */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-900 pb-2 border-b border-gray-100">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Shipping Address</span>
              </div>
              <p className="font-bold text-gray-800">{order.shippingAddress?.fullName}</p>
              <p className="text-gray-500">{order.shippingAddress?.phone}</p>
              <p className="text-gray-500">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p className="text-gray-500">{order.shippingAddress?.addressLine2}</p>}
              <p className="text-gray-500">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p className="text-gray-500">{order.shippingAddress?.country || 'USA'}</p>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-900 pb-2 border-b border-gray-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Payment Information</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Method:</span>
                <span className="font-semibold text-gray-900">{order.payment?.paymentMethod || 'MOCK_PAYMENT'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Transaction ID:</span>
                <span className="font-mono text-[11px] text-gray-900 truncate max-w-[150px]">{order.payment?.transactionId || 'MOCK-TXN'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Status:</span>
                <span className="text-emerald-600 font-bold">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-gray-900 pb-2 border-b border-gray-100">Order Totals</h3>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'}):</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (5%):</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping:</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.shipping)}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-lg text-blue-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
