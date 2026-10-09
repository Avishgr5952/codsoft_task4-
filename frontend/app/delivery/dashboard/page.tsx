'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { formatPrice, formatDate } from '../../../lib/utils';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Send,
  Navigation,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function DeliveryDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteModalDelivery, setNoteModalDelivery] = useState<any | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.delivery.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load courier dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleUpdateStatus = async (deliveryId: string, nextStatus: string, notes?: string) => {
    try {
      setUpdatingId(deliveryId);
      await api.delivery.updateStatus(deliveryId, {
        status: nextStatus,
        deliveryNotes: notes || undefined,
      });
      setNoteModalDelivery(null);
      setDeliveryNote('');
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to advance delivery status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const partner = data?.partner || {};
  const metrics = data?.metrics || { total: 0, pending: 0, completed: 0 };
  const allDeliveries = data?.deliveries || [];

  const filteredDeliveries = allDeliveries.filter((d: any) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') {
      return ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(d.status);
    }
    return d.status === statusFilter;
  });

  const getNextAction = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return { label: 'Accept Assignment', nextStatus: 'ACCEPTED', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'ACCEPTED':
        return { label: 'Mark Picked Up', nextStatus: 'PICKED_UP', color: 'bg-purple-600 hover:bg-purple-700' };
      case 'PICKED_UP':
        return { label: 'Start Route (Out for Delivery)', nextStatus: 'OUT_FOR_DELIVERY', color: 'bg-amber-600 hover:bg-amber-700' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Complete Delivery', nextStatus: 'DELIVERED', color: 'bg-emerald-600 hover:bg-emerald-700', promptNote: true };
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'PICKED_UP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ASSIGNED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Partner Banner and Fleet Details */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                {partner.vehicleType ? `${partner.vehicleType} Courier` : 'Logistics Partner'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                ACTIVE ON ROUTE
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Vehicle Tag: <span className="font-mono font-bold text-gray-700">{partner.vehicleNumber || 'MH-FLEET-01'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Courier Status</span>
            <span className="font-black text-emerald-600">Available For Dispatch</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Assigned</span>
            <div className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics.total}</div>
          <p className="text-xs text-gray-500 mt-1">Lifetime route packages</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Deliveries</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.pending}</div>
          <p className="text-xs text-gray-500 mt-1">Requiring pickup / transit / dropoff</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Successfully Delivered</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.completed}</div>
          <p className="text-xs text-gray-500 mt-1">Completed handovers</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'DELIVERED'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === filter
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-100'
            }`}
          >
            {filter === 'ALL'
              ? `All Orders (${allDeliveries.length})`
              : filter === 'PENDING'
              ? `Active Deliveries (${metrics.pending})`
              : `Delivered (${metrics.completed})`}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No deliveries matching current view</p>
            <p className="text-xs text-gray-400">New assignments will automatically arrive as orders are confirmed.</p>
          </div>
        ) : (
          filteredDeliveries.map((delivery: any) => {
            const nextAction = getNextAction(delivery.status);
            const isUpdating = updatingId === delivery.id;
            const address = delivery.order?.shippingAddress as any;
            const buyer = delivery.order?.user;

            return (
              <div
                key={delivery.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-gray-900 font-mono">
                      #{delivery.order?.orderNumber || 'MH-ORDER'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Assigned: {formatDate(delivery.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${getStatusBadge(
                        delivery.status
                      )}`}
                    >
                      {delivery.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {formatPrice(delivery.order?.totalAmount || 0)}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Destination */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Delivery Destination</span>
                    </div>
                    {address ? (
                      <div className="text-gray-600 pl-6 space-y-0.5">
                        <p className="font-bold text-gray-900">{address.fullName || `${buyer?.firstName} ${buyer?.lastName}`}</p>
                        <p>{address.streetAddress || address.addressLine1}</p>
                        <p>
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        {address.phone && (
                          <p className="flex items-center gap-1.5 pt-1 text-gray-800 font-bold">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {address.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 pl-6">Address details pending in invoice</p>
                    )}
                  </div>

                  {/* Consignment Items */}
                  <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span>Package Cargo ({delivery.order?.orderItems?.length || 0} items)</span>
                    </div>
                    <div className="pl-6 space-y-1.5 text-gray-600 max-h-24 overflow-y-auto">
                      {delivery.order?.orderItems?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="truncate max-w-[200px]">
                            {item.quantity}x {item.productName || item.product?.name}
                          </span>
                          <span className="font-bold text-gray-800">{formatPrice(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Notes if any */}
                {delivery.deliveryNotes && (
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>Courier Handover Note: {delivery.deliveryNotes}</span>
                  </div>
                )}

                {/* Action Stepper Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] text-gray-400">
                    {delivery.actualDelivery ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Handover recorded on {formatDate(delivery.actualDelivery)}
                      </span>
                    ) : (
                      <span>Current logistics phase: {delivery.status.replace(/_/g, ' ')}</span>
                    )}
                  </div>

                  {nextAction && (
                    <button
                      onClick={() => {
                        if (nextAction.promptNote) {
                          setNoteModalDelivery(delivery);
                        } else {
                          handleUpdateStatus(delivery.id, nextAction.nextStatus);
                        }
                      }}
                      disabled={isUpdating}
                      className={`px-5 py-2.5 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${nextAction.color} disabled:opacity-50`}
                    >
                      <span>{nextAction.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Final Handover */}
      {noteModalDelivery && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Confirm Order Handover</h3>
                <p className="text-xs text-gray-500">Order #{noteModalDelivery.order?.orderNumber}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-gray-700">Delivery Notes / Handover Proof</label>
              <textarea
                rows={3}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Received by customer, signed at front door."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNoteModalDelivery(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingId === noteModalDelivery.id}
                onClick={() =>
                  handleUpdateStatus(noteModalDelivery.id, 'DELIVERED', deliveryNote || 'Handover completed')
                }
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {updatingId === noteModalDelivery.id ? 'Updating...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
