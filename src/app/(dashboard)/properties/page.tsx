'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, MapPin, Home, MoreHorizontal } from 'lucide-react';

interface Property {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: string;
  units?: any[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

  async function fetchProperties() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = properties.filter(p =>
    p.address_line1.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    vacant: 'bg-yellow-100 text-yellow-800',
    listed: 'bg-blue-100 text-blue-800',
    under_contract: 'bg-purple-100 text-purple-800',
    sold: 'bg-gray-100 text-gray-800',
    inactive: 'bg-red-100 text-red-800',
  };

  const propertyTypeLabels: Record<string, string> = {
    sfr: 'Single Family',
    duplex: 'Duplex',
    triplex: 'Triplex',
    quadplex: 'Quadplex',
    multifamily: 'Multifamily',
    condo: 'Condo',
    townhouse: 'Townhouse',
    mobile: 'Mobile Home',
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental portfolio</p>
        </div>
        <Link
          href="/properties/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
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
            <option value="vacant">Vacant</option>
            <option value="listed">Listed</option>
            <option value="under_contract">Under Contract</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading properties...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first property</p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beds/Baths</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/properties/${property.id}`} className="hover:text-blue-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{property.address_line1}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {property.city}, {property.state} {property.zip}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {propertyTypeLabels[property.property_type] || property.property_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.units?.length || 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {property.beds || '-'} / {property.baths || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[property.status] || 'bg-gray-100 text-gray-800'}`}>
                        {property.status.replace('_', ' ')}
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
