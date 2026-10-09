'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  Users,
  Search,
  Shield,
  Truck,
  Store,
  User,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res: any = await api.users.getAll(params);
      setUsers(res?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(userId);
      await api.users.updateRole(userId, newRole);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = !user.isActive;
    const actionWord = nextStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionWord} account for ${user.email}?`)) return;

    try {
      setActionLoading(user.id);
      await api.users.toggleStatus(user.id, nextStatus);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    } finally {
      setActionLoading(null);
    }
  };

  const rolesList = ['ALL', 'CUSTOMER', 'VENDOR', 'DELIVERY_PARTNER', 'ADMIN'];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-rose-500" />;
      case 'VENDOR':
        return <Store className="w-3.5 h-3.5 text-blue-500" />;
      case 'DELIVERY_PARTNER':
        return <Truck className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <User className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Identity & User Management</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage user accounts, assign role permissions (Customer, Vendor, Courier, Admin), and freeze unauthorized profiles.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {rolesList.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-gray-100/70 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user email or name..."
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

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
            Loading platform users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No users found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">User Identity</th>
                  <th className="py-4 px-6">Contact Phone</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">RBAC Role</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {users.map((user) => {
                  const isActing = actionLoading === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      {/* Identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700 font-black flex-shrink-0">
                            {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-[11px] text-gray-400 block">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                        {user.phone || '—'}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6 text-gray-500 text-[11px]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Role Selector */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <select
                            value={user.role}
                            disabled={isActing}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:border-rose-500"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="VENDOR">VENDOR</option>
                            <option value="DELIVERY_PARTNER">DELIVERY_PARTNER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isActing}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50 ${
                            user.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
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
