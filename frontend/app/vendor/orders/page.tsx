'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatPrice, formatDate } from '../../../lib/utils';
import { ShoppingBag, Search, Check, Truck, ChevronDown } from 'lucide-react';
import { OrderStatus } from '../../../types';

export default function VendorOrdersPage() {
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data: any = await api.orders.getVendorOrders({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      if (Array.isArray(data)) {
        setVendorOrders(data);
      }
    } catch (err) {
      console.error('Failed to load vendor orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (vendorOrderId: string, newStatus: OrderStatus, tracking?: string) => {
    setUpdatingId(vendorOrderId);
    try {
      await api.orders.updateVendorOrderStatus(vendorOrderId, {
        status: newStatus,
        trackingNumber: tracking || undefined,
      });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const statuses: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-semibold bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none self-start"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-4">Order #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4">Your Subtotal</th>
              <th className="p-4">Your Net Earnings</th>
              <th className="p-4">Tracking #</th>
              <th className="p-4 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">Loading vendor orders...</td>
              </tr>
            ) : vendorOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">No orders found.</td>
              </tr>
            ) : (
              vendorOrders.map((vo) => {
                const isUpdating = updatingId === vo.id;
                return (
                  <tr key={vo.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4 font-mono font-bold text-blue-600">
                      #{vo.order?.orderNumber}
                      <span className="block text-[10px] text-gray-400 font-normal">
                        {formatDate(vo.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800">
                      <p className="font-bold">{vo.order?.user?.firstName} {vo.order?.user?.lastName}</p>
                      <p className="text-[11px] text-gray-400">{vo.order?.user?.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        {vo.orderItems?.map((i: any) => (
                          <p key={i.id} className="text-gray-700 truncate max-w-[180px]">
                            {i.quantity}x {i.productName}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-900">{formatPrice(vo.subtotal)}</td>
                    <td className="p-4 font-extrabold text-emerald-600">{formatPrice(vo.netEarnings)}</td>
                    <td className="p-4 font-mono text-[11px] text-gray-500">
                      {vo.trackingNumber || 'Pending'}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        disabled={isUpdating}
                        value={vo.status}
                        onChange={(e) => handleUpdateStatus(vo.id, e.target.value as OrderStatus, vo.trackingNumber)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border border-gray-200 focus:outline-none ${
                          vo.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : vo.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
