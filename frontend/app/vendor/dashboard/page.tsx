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
  AlertTriangle,
  ArrowUpRight,
  Store,
  ChevronRight,
  Boxes,
} from 'lucide-react';

export default function VendorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.vendors.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load vendor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];
  const chartData = data?.chartData || [];

  return (
    <div className="space-y-8">
      {/* Top Notice if Store Pending */}
      {data?.status === 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Store Status: Pending Approval</p>
            <p className="text-amber-700 font-normal mt-0.5">
              Your store is currently under review by marketplace administrators. Once approved, your products will be active and purchasable by customers.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Sales */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(metrics.grossSales)}</p>
          <p className="text-[11px] text-gray-400">Total volume processed</p>
        </div>

        {/* Net Vendor Earnings */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Net Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatPrice(metrics.netEarnings)}</p>
          <p className="text-[11px] text-gray-400">After {data?.commissionRate || 10}% platform commission</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics.totalOrders || 0}</p>
          <p className="text-[11px] text-gray-400">{metrics.completedOrders || 0} completed • {metrics.pendingOrders || 0} pending</p>
        </div>

        {/* Catalog & Low Stock */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{metrics.lowStockProducts || 0}</p>
          <p className="text-[11px] text-rose-600 font-semibold">Low-stock items requiring restock</p>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">7-Day Sales Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daily net revenue generated by your store</p>
          </div>
        </div>

        {/* Bar Chart Representation */}
        <div className="pt-4 grid grid-cols-7 gap-3 items-end h-44 border-b border-gray-100 pb-2">
          {chartData.map((d: any) => {
            const maxSales = Math.max(...chartData.map((x: any) => x.sales), 100);
            const heightPercent = Math.max(8, Math.round((d.sales / maxSales) * 100));
            return (
              <div key={d.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition">
                  {formatPrice(d.sales)}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-xl transition-all duration-300 group-hover:from-amber-600 group-hover:to-amber-500 shadow-sm"
                />
                <span className="text-[10px] font-semibold text-gray-400 truncate w-full text-center">
                  {d.date.split('-').slice(1).join('/')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Recent Orders</h3>
            <Link href="/vendor/orders" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No orders received yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 space-y-3">
              {recentOrders.map((ord: any) => (
                <div key={ord.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600">#{ord.orderNumber}</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">{ord.customerName} • {ord.itemsCount} item(s)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-gray-900 block">{formatPrice(ord.netEarnings)}</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Top Products</h3>
            <Link href="/vendor/products" className="text-xs font-bold text-blue-600 hover:underline">
              Manage Catalog
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No sales data yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 space-y-3">
              {topProducts.map((p: any) => (
                <div key={p.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.sold} units sold</p>
                  </div>
                  <span className="font-black text-gray-900">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
