'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatPrice, formatDate } from '../../../lib/utils';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Store,
  AlertCircle,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  ChevronRight,
  Percent,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickApproveVendor = async (vendorId: string) => {
    try {
      setActionLoading(vendorId);
      await api.vendors.updateStatusAdmin(vendorId, 'APPROVED');
      await loadDashboard();
    } catch (err) {
      console.error('Failed to approve vendor:', err);
      alert('Failed to approve vendor');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const recentVendors = data?.recentVendors || [];
  const chartData = data?.chartData || [];

  const maxGross = Math.max(...chartData.map((d: any) => d.grossSales || 1), 100);

  return (
    <div className="space-y-8">
      {/* Top Pending Vendors Notification */}
      {metrics.pendingVendors > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">
                {metrics.pendingVendors} Vendor Application{metrics.pendingVendors > 1 ? 's' : ''} Awaiting Review
              </p>
              <p className="text-xs text-amber-700">
                New sellers submitted their onboarding documents and require administrator authorization.
              </p>
            </div>
          </div>
          <Link
            href="/admin/vendors?status=PENDING"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            Review Applications <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Gross GMV</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {formatPrice(metrics.totalGrossSales || 0)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Platform lifetime transactions</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Platform Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {formatPrice(metrics.totalCommission || 0)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-gray-500">
            <span>Vendor payouts: {formatPrice(metrics.totalVendorPayouts || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {metrics.totalOrders || 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-blue-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{metrics.pendingOrders || 0} pending processing</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Ecosystem</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {metrics.totalUsers || 0}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-gray-500">
            <span>{metrics.totalVendors || 0} vendors</span>
            <span>•</span>
            <span>{metrics.totalProducts || 0} products</span>
          </div>
        </div>
      </div>

      {/* 7-Day Revenue & Commission Trends */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              7-Day Marketplace Revenue Analytics
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Comparison between gross customer purchases and platform commissions
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-gray-600">Gross Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-gray-600">Admin Commission</span>
            </div>
          </div>
        </div>

        <div className="h-56 flex items-end gap-4 pt-6 px-2">
          {chartData.map((d: any, idx: number) => {
            const grossHeight = Math.max(12, Math.round((d.grossSales / maxGross) * 180));
            const commHeight = Math.max(8, Math.round((d.commission / maxGross) * 180));
            const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative flex items-end gap-1.5 w-full justify-center">
                  {/* Gross Bar */}
                  <div
                    style={{ height: `${grossHeight}px` }}
                    className="w-5 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition relative group/bar"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-10 transition">
                      Gross: {formatPrice(d.grossSales)}
                    </div>
                  </div>
                  {/* Commission Bar */}
                  <div
                    style={{ height: `${commHeight}px` }}
                    className="w-5 bg-rose-500 hover:bg-rose-600 rounded-t-lg transition relative group/comm"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover/comm:opacity-100 pointer-events-none whitespace-nowrap z-10 transition">
                      Comm: {formatPrice(d.commission)}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-gray-400 group-hover:text-gray-700 transition">
                  {dayLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Pending/Recent Vendors & Recent Platform Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vendor Applications & Stores */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Vendor Applications & Stores
              </h2>
              <p className="text-xs text-gray-400">Recent seller registrations and statuses</p>
            </div>
            <Link
              href="/admin/vendors"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              Manage all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {recentVendors.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No vendors onboarded yet.</p>
            ) : (
              recentVendors.map((vendor: any) => (
                <div key={vendor.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-700 font-black">
                      <Store className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{vendor.storeName}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {vendor.user?.email} • {vendor.commissionRate}% comm.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        vendor.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : vendor.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {vendor.status}
                    </span>

                    {vendor.status === 'PENDING' && (
                      <button
                        onClick={() => handleQuickApproveVendor(vendor.id)}
                        disabled={actionLoading === vendor.id}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-gray-400">Real-time marketplace transactions</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No orders placed yet.</p>
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                      <span className="text-[10px] font-bold text-gray-400">• {formatDate(order.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {order.user?.firstName} {order.user?.lastName} ({order.user?.email})
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700'
                          : order.status === 'PROCESSING'
                          ? 'bg-purple-50 text-purple-700'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
