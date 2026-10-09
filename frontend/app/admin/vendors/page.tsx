'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Shield,
  Layers,
  ShoppingBag,
  Filter,
} from 'lucide-react';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res: any = await api.vendors.getAllAdmin(params);
      setVendors(res?.vendors || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors();
  };

  const handleUpdateStatus = async (vendorId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to set vendor status to ${newStatus}?`)) {
      return;
    }
    try {
      setActionLoading(vendorId);
      await api.vendors.updateStatusAdmin(vendorId, newStatus);
      await loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to update vendor status');
    } finally {
      setActionLoading(null);
    }
  };

  const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Vendor Management & Approvals</h2>
          <p className="text-xs text-gray-500 mt-1">
            Authorize seller stores, audit compliance, adjust commissions, or suspend non-compliant accounts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-gray-100/70 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {status === 'ALL' ? 'All Vendors' : status}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store or seller email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
            Loading vendors directory...
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Store className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No vendors found matching criteria</p>
            <p className="text-xs text-gray-400">Try adjusting your status filter or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">Store & Slug</th>
                  <th className="py-4 px-6">Merchant / Contact</th>
                  <th className="py-4 px-6">Commission</th>
                  <th className="py-4 px-6">Catalog / Orders</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {vendors.map((vendor) => {
                  const isActioning = actionLoading === vendor.id;

                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/60 transition">
                      {/* Store */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black flex-shrink-0 border border-rose-100">
                            {vendor.storeName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{vendor.storeName}</span>
                            <span className="text-[11px] text-gray-400 block font-mono">
                              /vendors/{vendor.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900 block">
                          {vendor.user?.firstName} {vendor.user?.lastName}
                        </span>
                        <span className="text-[11px] text-gray-500 block">{vendor.user?.email}</span>
                      </td>

                      {/* Commission */}
                      <td className="py-4 px-6">
                        <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-xs">
                          {vendor.commissionRate}%
                        </span>
                      </td>

                      {/* Catalog / Orders */}
                      <td className="py-4 px-6 text-gray-600">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-gray-400" />
                            <span>{vendor._count?.products || 0} Products</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                            <span>{vendor._count?.vendorOrders || 0} Orders</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            vendor.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : vendor.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : vendor.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {vendor.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(vendor.id, 'APPROVED')}
                                disabled={isActioning}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(vendor.id, 'REJECTED')}
                                disabled={isActioning}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {vendor.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(vendor.id, 'SUSPENDED')}
                              disabled={isActioning}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}

                          {(vendor.status === 'SUSPENDED' || vendor.status === 'REJECTED') && (
                            <button
                              onClick={() => handleUpdateStatus(vendor.id, 'APPROVED')}
                              disabled={isActioning}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                            </button>
                          )}
                        </div>
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
