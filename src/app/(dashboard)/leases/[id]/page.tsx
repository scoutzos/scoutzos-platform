'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, FileText, Calendar, DollarSign, Home, User, AlertTriangle } from 'lucide-react';

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('terms');

  useEffect(() => {
    fetchLease();
  }, [params.id]);

  async function fetchLease() {
    try {
      const res = await fetch(`/api/leases/${params.id}`);
      if (res.ok) setLease(await res.json());
    } catch (error) {
      console.error('Failed to fetch lease:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this lease?')) return;
    const res = await fetch(`/api/leases/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/leases');
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_signature: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    terminated: 'bg-red-100 text-red-800',
    renewed: 'bg-blue-100 text-blue-800',
  };

  function formatDate(d: string | null) {
    return d ? new Date(d).toLocaleDateString() : '-';
  }

  function getDaysRemaining() {
    if (!lease?.end_date) return null;
    return Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;

  if (!lease) {
    return (
      <div className="p-6 text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Lease not found</h3>
        <Link href="/leases" className="text-blue-600">Back to leases</Link>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="p-6">
      <Link href="/leases" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leases
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{lease.property?.address_line1}{lease.unit && ` #${lease.unit.unit_number}`}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[lease.status] || 'bg-gray-100'}`}>{lease.status?.replace('_', ' ')}</span>
          </div>
          <p className="text-gray-600">{lease.tenant_profile?.first_name} {lease.tenant_profile?.last_name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/leases/${lease.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {daysRemaining !== null && daysRemaining <= 60 && daysRemaining > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div><div className="font-medium text-yellow-800">Lease Expiring Soon</div><div className="text-sm text-yellow-700">Expires in {daysRemaining} days</div></div>
        </div>
      )}

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['terms', 'payments', 'documents'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Lease Terms</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><div className="text-sm text-gray-500">Type</div><div className="font-medium capitalize">{lease.lease_type?.replace('_', ' ')}</div></div>
              <div><div className="text-sm text-gray-500">Start Date</div><div className="font-medium">{formatDate(lease.start_date)}</div></div>
              <div><div className="text-sm text-gray-500">End Date</div><div className="font-medium">{formatDate(lease.end_date)}</div></div>
              <div><div className="text-sm text-gray-500">Rent Due Day</div><div className="font-medium">Day {lease.rent_due_day}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Financial</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500">Monthly Rent</span><span className="font-semibold text-lg">${lease.rent_amount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Security Deposit</span><span className="font-medium">{lease.security_deposit ? `$${lease.security_deposit.toLocaleString()}` : '-'}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Payments</h2><p className="text-gray-500">Coming soon...</p></div>}
      {activeTab === 'documents' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Documents</h2><p className="text-gray-500">Coming soon...</p></div>}
    </div>
  );
}
