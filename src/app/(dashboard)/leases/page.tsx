'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Calendar, DollarSign, MoreHorizontal } from 'lucide-react';

interface Lease {
  id: string;
  lease_type: string;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  status: string;
  property?: { address_line1: string; city: string; state: string };
  unit?: { unit_number: string };
  tenant_profile?: { first_name: string; last_name: string; email: string };
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLeases();
  }, [statusFilter]);

  async function fetchLeases() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/leases?${params}`);
      const data = await res.json();
      setLeases(data);
    } catch (error) {
      console.error('Failed to fetch leases:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeases = leases.filter(l =>
    l.property?.address_line1.toLowerCase().includes(search.toLowerCase()) ||
    `${l.tenant_profile?.first_name} ${l.tenant_profile?.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_signature: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    terminated: 'bg-red-100 text-red-800',
    renewed: 'bg-blue-100 text-blue-800',
  };

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600">Manage lease agreements</p>
        </div>
        <Link
          href="/leases/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Lease
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_signature">Pending Signature</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading leases...</div>
        ) : filteredLeases.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
            <p className="text-gray-500 mb-4">Create your first lease agreement</p>
            <Link
              href="/leases/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Lease
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/leases/${lease.id}`} className="hover:text-blue-600">
                        <div className="font-medium text-gray-900">
                          {lease.property?.address_line1}
                          {lease.unit && ` #${lease.unit.unit_number}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lease.property?.city}, {lease.property?.state}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {lease.tenant_profile?.first_name} {lease.tenant_profile?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lease.tenant_profile?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(lease.start_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {lease.end_date ? formatDate(lease.end_date) : 'Month-to-Month'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {lease.rent_amount.toLocaleString()}/mo
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[lease.status] || 'bg-gray-100 text-gray-800'}`}>
                        {lease.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
