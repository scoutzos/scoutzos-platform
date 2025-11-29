'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Briefcase, CreditCard, DollarSign } from 'lucide-react';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchTenant();
  }, [params.id]);

  async function fetchTenant() {
    try {
      const res = await fetch(`/api/tenants/${params.id}`);
      if (res.ok) setTenant(await res.json());
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this tenant?')) return;
    const res = await fetch(`/api/tenants/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/tenants');
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;

  if (!tenant) {
    return (
      <div className="p-6 text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Tenant not found</h3>
        <Link href="/tenants" className="text-blue-600">Back to tenants</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/tenants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{tenant.first_name?.[0]}{tenant.last_name?.[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tenant.first_name} {tenant.last_name}</h1>
            <p className="text-gray-600">{tenant.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/tenants/${tenant.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['profile', 'employment', 'screening', 'documents'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Email</div><div className="font-medium">{tenant.email}</div></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div><div className="text-sm text-gray-500">Phone</div><div className="font-medium">{tenant.phone || '-'}</div></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Credit Score</span><span className="font-medium">{tenant.credit_score || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Monthly Income</span><span className="font-medium">{tenant.income_monthly ? `$${tenant.income_monthly.toLocaleString()}` : '-'}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Employment</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div><div className="text-sm text-gray-500">Employer</div><div className="font-medium">{tenant.employer || '-'}</div></div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div><div className="text-sm text-gray-500">Monthly Income</div><div className="font-medium">{tenant.income_monthly ? `$${tenant.income_monthly.toLocaleString()}` : '-'}{tenant.income_verified && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified</span>}</div></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'screening' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Screening</h2>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div><div className="text-sm text-gray-500">Credit Score</div><div className="font-medium text-2xl">{tenant.credit_score || '-'}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Documents</h2><p className="text-gray-500">Coming soon...</p></div>}
    </div>
  );
}
