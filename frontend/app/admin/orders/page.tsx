'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatPrice, formatDate } from '../../../lib/utils';
import {
  ShoppingBag,
  Search,
  Filter,
  ExternalLink,
  Store,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  ChevronRight,
  User,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res: any = await api.orders.getAllAdmin(params);
      setOrders(res?.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      await api.orders.updateStatusAdmin(orderId, newStatus);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusList = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Marketplace Orders Oversight</h2>
          <p className="text-xs text-gray-500 mt-1">
            Supervise fulfillment across all seller packages, verify payment statuses, and manage dispute resolution.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statusList.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-gray-100/70 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order # or Buyer email..."
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

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
            Loading order histories...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No orders found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">Order Details</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Vendors Involved</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Payment</th>
                  <th className="py-4 px-6">Status & Override</th>
                  <th className="py-4 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {orders.map((order) => {
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      {/* Order info */}
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-black text-gray-900 block font-mono text-xs">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {formatDate(order.createdAt)} • {order._count?.orderItems || 0} items
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {order.user?.firstName} {order.user?.lastName}
                            </span>
                            <span className="text-[11px] text-gray-400 block">{order.user?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vendors */}
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {order.vendorOrders?.map((vo: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-semibold text-gray-700"
                            >
                              <Store className="w-3 h-3 text-gray-400" />
                              {vo.vendor?.storeName || 'Vendor'}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-6 font-black text-gray-900 text-sm">
                        {formatPrice(order.totalAmount)}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus || 'PENDING'}
                        </span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {order.paymentMethod || 'MOCK_CARD'}
                        </span>
                      </td>

                      {/* Status & Quick Override */}
                      <td className="py-4 px-6">
                        <select
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none transition ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : order.status === 'PROCESSING'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      {/* View details */}
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                        >
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
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
