'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Wrench, Clock, AlertTriangle, CheckCircle, Home, User, Truck } from 'lucide-react';

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchWorkOrder();
  }, [params.id]);

  async function fetchWorkOrder() {
    try {
      const res = await fetch(`/api/work-orders/${params.id}`);
      if (res.ok) setWorkOrder(await res.json());
    } catch (error) {
      console.error('Failed to fetch work order:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this work order?')) return;
    const res = await fetch(`/api/work-orders/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/maintenance');
  }

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/work-orders/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchWorkOrder();
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    triaged: 'bg-purple-100 text-purple-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-gray-100 text-gray-800',
  };

  const priorityIcons: Record<string, JSX.Element> = {
    emergency: <AlertTriangle className="w-5 h-5 text-red-500" />,
    urgent: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    routine: <Clock className="w-5 h-5 text-blue-500" />,
    preventive: <CheckCircle className="w-5 h-5 text-green-500" />,
  };

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;

  if (!workOrder) {
    return (
      <div className="p-6 text-center py-12">
        <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Work order not found</h3>
        <Link href="/maintenance" className="text-blue-600">Back to maintenance</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/maintenance" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Maintenance
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{workOrder.title}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[workOrder.status] || 'bg-gray-100'}`}>{workOrder.status?.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">{priorityIcons[workOrder.priority]}<span className="capitalize">{workOrder.priority}</span></span>
            <span>{workOrder.category}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/maintenance/${workOrder.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {workOrder.status !== 'completed' && workOrder.status !== 'canceled' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600">Update Status:</span>
          <div className="flex gap-2">
            {workOrder.status === 'new' && <button onClick={() => updateStatus('assigned')} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Assign</button>}
            {workOrder.status === 'assigned' && <button onClick={() => updateStatus('in_progress')} className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm">Start</button>}
            {workOrder.status === 'in_progress' && <button onClick={() => updateStatus('completed')} className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">Complete</button>}
            <button onClick={() => updateStatus('canceled')} className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['details', 'timeline', 'photos'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{workOrder.description || 'No description'}</p>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div><div className="font-medium">{workOrder.property?.address_line1}{workOrder.unit && ` #${workOrder.unit.unit_number}`}</div></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Vendor</h2>
              {workOrder.vendor ? (
                <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-gray-400" /><div><div className="font-medium">{workOrder.vendor.company_name}</div></div></div>
              ) : <p className="text-gray-500">No vendor assigned</p>}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Cost</h2>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span>{workOrder.estimated_cost ? `$${workOrder.estimated_cost}` : '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Actual</span><span>{workOrder.actual_cost ? `$${workOrder.actual_cost}` : '-'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Timeline</h2><p className="text-gray-500">Coming soon...</p></div>}
      {activeTab === 'photos' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Photos</h2><p className="text-gray-500">No photos attached</p></div>}
    </div>
  );
}
