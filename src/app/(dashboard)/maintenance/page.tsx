'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Wrench, AlertTriangle, Clock, CheckCircle, MoreHorizontal } from 'lucide-react';

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  property?: { address_line1: string; city: string; state: string };
  unit?: { unit_number: string };
  tenant_profile?: { first_name: string; last_name: string };
  vendor?: { company_name: string };
}

export default function MaintenancePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter, priorityFilter]);

  async function fetchWorkOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const res = await fetch(`/api/work-orders?${params}`);
      const data = await res.json();
      setWorkOrders(data);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.title.toLowerCase().includes(search.toLowerCase()) ||
    wo.property?.address_line1.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    triaged: 'bg-purple-100 text-purple-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-orange-100 text-orange-800',
    pending_approval: 'bg-pink-100 text-pink-800',
    completed: 'bg-green-100 text-green-800',
    canceled: 'bg-gray-100 text-gray-800',
  };

  const priorityIcons: Record<string, JSX.Element> = {
    emergency: <AlertTriangle className="w-4 h-4 text-red-500" />,
    urgent: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    routine: <Clock className="w-4 h-4 text-blue-500" />,
    preventive: <CheckCircle className="w-4 h-4 text-green-500" />,
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600">Manage work orders and repairs</p>
        </div>
        <Link
          href="/maintenance/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Work Order
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search work orders..."
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
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
            <option value="preventive">Preventive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading work orders...</div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-500 mb-4">Create a work order to track maintenance requests</p>
            <Link
              href="/maintenance/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Work Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredWorkOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/maintenance/${wo.id}`} className="hover:text-blue-600">
                        <div className="font-medium text-gray-900">{wo.title}</div>
                        <div className="text-sm text-gray-500">{wo.category}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {wo.property?.address_line1}
                        {wo.unit && ` #${wo.unit.unit_number}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {wo.property?.city}, {wo.property?.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {priorityIcons[wo.priority]}
                        <span className="text-sm capitalize">{wo.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {wo.vendor?.company_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[wo.status] || 'bg-gray-100 text-gray-800'}`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(wo.created_at)}
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
