'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Home, MapPin, Building2, Bed, Bath, Square, Calendar, DollarSign } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProperty();
  }, [params.id]);

  async function fetchProperty() {
    try {
      const res = await fetch(`/api/properties/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProperty(data);
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this property?')) return;
    const res = await fetch(`/api/properties/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/properties');
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    vacant: 'bg-yellow-100 text-yellow-800',
    listed: 'bg-blue-100 text-blue-800',
    under_contract: 'bg-purple-100 text-purple-800',
    sold: 'bg-gray-100 text-gray-800',
    inactive: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;
  }

  if (!property) {
    return (
      <div className="p-6 text-center py-12">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Property not found</h3>
        <Link href="/properties" className="text-blue-600">Back to properties</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/properties" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Properties
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{property.address_line1}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[property.status] || 'bg-gray-100'}`}>
              {property.status}
            </span>
          </div>
          <p className="text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/properties/${property.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['overview', 'units', 'financials', 'documents'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Type</div><div className="font-medium">{property.property_type}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Beds</div><div className="font-medium">{property.beds || '-'}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Baths</div><div className="font-medium">{property.baths || '-'}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <Square className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Sq Ft</div><div className="font-medium">{property.sqft?.toLocaleString() || '-'}</div></div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Year Built</div><div className="font-medium">{property.year_built || '-'}</div></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Financial</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Purchase Price</span><span className="font-medium">{property.purchase_price ? `$${property.purchase_price.toLocaleString()}` : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Value</span><span className="font-medium">{property.current_value ? `$${property.current_value.toLocaleString()}` : '-'}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'units' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Units</h2>
            <Link href={`/properties/${property.id}/units/new`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Unit</Link>
          </div>
          {property.units?.length > 0 ? (
            <div className="divide-y">
              {property.units.map((unit: any) => (
                <div key={unit.id} className="py-3 flex justify-between">
                  <div><div className="font-medium">Unit {unit.unit_number}</div><div className="text-sm text-gray-500">{unit.beds} bed / {unit.baths} bath</div></div>
                  <div className="text-right"><div className="font-medium">${unit.market_rent?.toLocaleString()}/mo</div><div className="text-sm text-gray-500">{unit.status}</div></div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No units added yet</p>}
        </div>
      )}

      {activeTab === 'financials' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Financials</h2><p className="text-gray-500">Coming soon...</p></div>}
      {activeTab === 'documents' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Documents</h2><p className="text-gray-500">Coming soon...</p></div>}
    </div>
  );
}
