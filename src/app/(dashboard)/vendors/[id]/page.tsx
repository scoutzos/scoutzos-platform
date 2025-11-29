'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Truck, Mail, Phone, MapPin, Shield, Star } from 'lucide-react';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchVendor();
  }, [params.id]);

  async function fetchVendor() {
    try {
      const res = await fetch(`/api/vendors/${params.id}`);
      if (res.ok) setVendor(await res.json());
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this vendor?')) return;
    const res = await fetch(`/api/vendors/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/vendors');
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    preferred: 'bg-purple-100 text-purple-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;

  if (!vendor) {
    return (
      <div className="p-6 text-center py-12">
        <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Vendor not found</h3>
        <Link href="/vendors" className="text-blue-600">Back to vendors</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/vendors" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Vendors
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{vendor.company_name}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[vendor.status] || 'bg-gray-100'}`}>{vendor.status}</span>
            {vendor.emergency_available && <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">24/7</span>}
          </div>
          {vendor.contact_name && <p className="text-gray-600">Contact: {vendor.contact_name}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/vendors/${vendor.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['overview', 'jobs', 'documents'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Contact</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><div><div className="text-sm text-gray-500">Email</div><div className="font-medium">{vendor.email}</div></div></div>
                <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><div><div className="text-sm text-gray-500">Phone</div><div className="font-medium">{vendor.phone}</div></div></div>
                {vendor.address && <div className="flex items-center gap-3 col-span-2"><MapPin className="w-5 h-5 text-gray-400" /><div><div className="text-sm text-gray-500">Address</div><div className="font-medium">{vendor.address}, {vendor.city}, {vendor.state} {vendor.zip}</div></div></div>}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Services</h2>
              <div className="flex flex-wrap gap-2">
                {vendor.categories?.map((cat: string) => (
                  <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{cat}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Jobs Completed</span><span className="font-medium">{vendor.jobs_completed || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">On-Time Rate</span><span className="font-medium">{vendor.jobs_completed ? Math.round((vendor.jobs_on_time / vendor.jobs_completed) * 100) : 0}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Revenue</span><span className="font-medium">${(vendor.total_revenue || 0).toLocaleString()}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Compliance</h2>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600"><Shield className="w-4 h-4 inline mr-1" />License</span><span>{vendor.license_verified ? '✓' : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600"><Shield className="w-4 h-4 inline mr-1" />Insurance</span><span>{vendor.insurance_verified ? '✓' : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">W-9</span><span>{vendor.w9_on_file ? '✓' : '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Jobs</h2><p className="text-gray-500">Coming soon...</p></div>}
      {activeTab === 'documents' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Documents</h2><p className="text-gray-500">Coming soon...</p></div>}
    </div>
  );
}
