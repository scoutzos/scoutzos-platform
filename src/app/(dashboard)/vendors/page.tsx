'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Truck, Star, Phone, Mail, MoreHorizontal } from 'lucide-react';

interface Vendor {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string;
  phone: string;
  categories: string[];
  status: string;
  reliability_score: number | null;
  quality_score: number | null;
  jobs_completed: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [statusFilter, categoryFilter]);

  async function fetchVendors() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await fetch(`/api/vendors?${params}`);
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.company_name.toLowerCase().includes(search.toLowerCase()) ||
    v.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    preferred: 'bg-purple-100 text-purple-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  const categories = [
    'plumbing', 'electrical', 'hvac', 'appliance', 'structural',
    'pest', 'landscaping', 'cleaning', 'painting', 'roofing'
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage service providers</p>
        </div>
        <Link
          href="/vendors/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
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
            <option value="active">Active</option>
            <option value="preferred">Preferred</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-4">Add vendors to assign to work orders</p>
            <Link
              href="/vendors/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/vendors/${vendor.id}`} className="hover:text-blue-600">
                        <div className="font-medium text-gray-900">{vendor.company_name}</div>
                        {vendor.contact_name && (
                          <div className="text-sm text-gray-500">{vendor.contact_name}</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Mail className="w-3 h-3" />
                          {vendor.email}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />
                          {vendor.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {vendor.categories.slice(0, 3).map(cat => (
                          <span key={cat} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {cat}
                          </span>
                        ))}
                        {vendor.categories.length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            +{vendor.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.quality_score ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm">{(vendor.quality_score / 20).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {vendor.jobs_completed}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[vendor.status] || 'bg-gray-100 text-gray-800'}`}>
                        {vendor.status}
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
