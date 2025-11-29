'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Mail, Phone, MoreHorizontal } from 'lucide-react';

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  credit_score: number | null;
  income_monthly: number | null;
  created_at: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    setLoading(true);
    try {
      const res = await fetch('/api/tenants');
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTenants = tenants.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage tenant profiles</p>
        </div>
        <Link
          href="/tenants/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Tenant
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-500 mb-4">Add tenant profiles to track your renters</p>
            <Link
              href="/tenants/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Tenant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/tenants/${tenant.id}`} className="hover:text-blue-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {tenant.first_name[0]}{tenant.last_name[0]}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {tenant.first_name} {tenant.last_name}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Mail className="w-3 h-3" />
                          {tenant.email}
                        </div>
                        {tenant.phone && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Phone className="w-3 h-3" />
                            {tenant.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant.credit_score || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant.income_monthly ? `$${tenant.income_monthly.toLocaleString()}` : '-'}
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
