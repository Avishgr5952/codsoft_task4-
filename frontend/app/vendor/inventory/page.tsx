'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatPrice } from '../../../lib/utils';
import { Search, Boxes, AlertTriangle, Check, Save } from 'lucide-react';

export default function VendorInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, { stock: number; threshold: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data: any = await api.inventory.getVendorInventory({
        search: search || undefined,
        lowStockOnly,
      });
      if (Array.isArray(data)) {
        setItems(data);
        const map: Record<string, { stock: number; threshold: number }> = {};
        data.forEach((i) => {
          map[i.productId] = { stock: i.availableQuantity, threshold: i.lowStockThreshold };
        });
        setEditValues(map);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [search, lowStockOnly]);

  const handleStockChange = (productId: string, val: number) => {
    setEditValues((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], stock: Math.max(0, val) },
    }));
  };

  const handleSaveStock = async (productId: string) => {
    setSavingId(productId);
    try {
      const current = editValues[productId];
      await api.inventory.update(productId, {
        availableQuantity: current.stock,
        lowStockThreshold: current.threshold,
      });
      await loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error updating stock');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by SKU or title..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start ${
            lowStockOnly
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock Items'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-4">Product</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Available Units</th>
              <th className="p-4">Sold Units</th>
              <th className="p-4">Alert Threshold</th>
              <th className="p-4">Stock Status</th>
              <th className="p-4 text-right">Quick Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">Loading inventory tracking...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">No inventory entries found.</td>
              </tr>
            ) : (
              items.map((item) => {
                const edits = editValues[item.productId] || { stock: item.availableQuantity, threshold: item.lowStockThreshold };
                const isSaving = savingId === item.productId;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-4 font-bold text-gray-900 max-w-[200px] truncate">
                      {item.product?.name}
                    </td>
                    <td className="p-4 font-mono text-gray-500">{item.sku}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        min="0"
                        value={edits.stock}
                        onChange={(e) => handleStockChange(item.productId, parseInt(e.target.value, 10) || 0)}
                        className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:bg-white"
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-600">{item.soldQuantity}</td>
                    <td className="p-4 font-semibold text-gray-600">{item.lowStockThreshold}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'OUT_OF_STOCK'
                            ? 'bg-red-50 text-red-600'
                            : item.status === 'LOW_STOCK'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSaveStock(item.productId)}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
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
