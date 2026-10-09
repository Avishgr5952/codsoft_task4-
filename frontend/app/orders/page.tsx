'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { Order } from '../../types';
import { api } from '../../lib/api';
import { formatPrice, formatDate } from '../../lib/utils';
import { ShoppingBag, ChevronRight, Package, Store } from 'lucide-react';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data: any = await api.orders.getMyOrders();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
          My Order History
        </h1>
        <p className="text-xs text-gray-500 mb-8">
          View all your previous purchases, tracking numbers, and order receipts.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-gray-200/70 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
              You haven't placed any orders yet. Discover high-quality products across our marketplace.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-blue-600">
                      #{order.orderNumber}
                    </span>
                    <p className="text-[11px] text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {/* Items & Vendors summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.vendorOrders?.map((vo) => (
                    <div key={vo.id} className="p-3 bg-gray-50 rounded-2xl space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-gray-800">
                        <span className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          {vo.vendor?.storeName || 'Vendor Package'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-semibold">{vo.status}</span>
                      </div>
                      {vo.trackingNumber && (
                        <p className="text-[10px] text-gray-400">Tracking: {vo.trackingNumber}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    View Order Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
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
