'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, UserPlus, Mail, Phone, Target, MoreHorizontal } from 'lucide-react';

interface Lead {
  id: string;
  lead_type: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  ai_qualification_score: number | null;
  source: string | null;
  created_at: string;
  property?: { address_line1: string; city: string; state: string };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [typeFilter, stageFilter]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('lead_type', typeFilter);
      if (stageFilter) params.append('pipeline_stage', stageFilter);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = leads.filter(l =>
    `${l.first_name} ${l.last_name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    tenant: 'bg-blue-100 text-blue-800',
    owner: 'bg-green-100 text-green-800',
    buyer: 'bg-purple-100 text-purple-800',
    seller: 'bg-orange-100 text-orange-800',
    mortgage: 'bg-indigo-100 text-indigo-800',
    vendor: 'bg-yellow-100 text-yellow-800',
  };

  const stageColors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-800',
    contacted: 'bg-blue-100 text-blue-800',
    qualified: 'bg-green-100 text-green-800',
    showing_scheduled: 'bg-purple-100 text-purple-800',
    application: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-red-100 text-red-800',
  };

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Manage your sales pipeline</p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="tenant">Tenant</option>
            <option value="owner">Owner</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="mortgage">Mortgage</option>
            <option value="vendor">Vendor</option>
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="showing_scheduled">Showing Scheduled</option>
            <option value="application">Application</option>
            <option value="approved">Approved</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500 mb-4">Start adding leads to your pipeline</p>
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/leads/${lead.id}`} className="hover:text-blue-600">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {lead.first_name[0]}{lead.last_name?.[0] || ''}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">
                            {lead.first_name} {lead.last_name || ''}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-gray-900">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[lead.lead_type] || 'bg-gray-100 text-gray-800'}`}>
                        {lead.lead_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[lead.pipeline_stage] || 'bg-gray-100 text-gray-800'}`}>
                        {lead.pipeline_stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.ai_qualification_score ? (
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">{lead.ai_qualification_score}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lead.source || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(lead.created_at)}
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
