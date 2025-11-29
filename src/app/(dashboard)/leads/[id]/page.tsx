'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, Target, Calendar, Home, MessageSquare } from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  async function fetchLead() {
    try {
      const res = await fetch(`/api/leads/${params.id}`);
      if (res.ok) setLead(await res.json());
    } catch (error) {
      console.error('Failed to fetch lead:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this lead?')) return;
    const res = await fetch(`/api/leads/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/leads');
  }

  async function updateStage(stage: string) {
    const res = await fetch(`/api/leads/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_stage: stage })
    });
    if (res.ok) fetchLead();
  }

  const typeColors: Record<string, string> = {
    tenant: 'bg-blue-100 text-blue-800',
    owner: 'bg-green-100 text-green-800',
    buyer: 'bg-purple-100 text-purple-800',
    seller: 'bg-orange-100 text-orange-800',
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

  const stages = ['new', 'contacted', 'qualified', 'showing_scheduled', 'application', 'approved', 'lost'];

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-gray-200 rounded"></div></div>;

  if (!lead) {
    return (
      <div className="p-6 text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Lead not found</h3>
        <Link href="/leads" className="text-blue-600">Back to leads</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/leads" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{lead.first_name?.[0]}{lead.last_name?.[0] || ''}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{lead.first_name} {lead.last_name || ''}</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[lead.lead_type] || 'bg-gray-100'}`}>{lead.lead_type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[lead.pipeline_stage] || 'bg-gray-100'}`}>{lead.pipeline_stage?.replace('_', ' ')}</span>
              {lead.ai_qualification_score && <span className="flex items-center gap-1 text-sm"><Target className="w-4 h-4 text-green-500" />Score: {lead.ai_qualification_score}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/leads/${lead.id}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500 mb-3">Pipeline Stage</div>
        <div className="flex gap-2 flex-wrap">
          {stages.map((stage) => (
            <button key={stage} onClick={() => updateStage(stage)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${lead.pipeline_stage === stage ? stageColors[stage] : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              {stage.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {['overview', 'activity', 'conversations'].map((tab) => (
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
            <h2 className="text-lg font-semibold mb-4">Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              {lead.email && <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><div><div className="text-sm text-gray-500">Email</div><div className="font-medium">{lead.email}</div></div></div>}
              {lead.phone && <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><div><div className="text-sm text-gray-500">Phone</div><div className="font-medium">{lead.phone}</div></div></div>}
            </div>
            {lead.lead_type === 'tenant' && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Requirements</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><div className="text-gray-500">Budget</div><div className="font-medium">{lead.budget_min && lead.budget_max ? `$${lead.budget_min} - $${lead.budget_max}` : '-'}</div></div>
                  <div><div className="text-gray-500">Beds</div><div className="font-medium">{lead.beds_wanted || '-'}</div></div>
                  <div><div className="text-gray-500">Baths</div><div className="font-medium">{lead.baths_wanted || '-'}</div></div>
                  <div><div className="text-gray-500">Move-in</div><div className="font-medium">{lead.move_in_date ? new Date(lead.move_in_date).toLocaleDateString() : '-'}</div></div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Source</span><span>{lead.source || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(lead.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>
            {lead.next_action && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Next Action</h2>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800">{lead.next_action}</div>
                  {lead.next_action_date && <div className="text-sm text-yellow-600 mt-1">{new Date(lead.next_action_date).toLocaleDateString()}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Activity</h2><p className="text-gray-500">Coming soon...</p></div>}
      {activeTab === 'conversations' && <div className="bg-white rounded-lg shadow p-6"><h2 className="text-lg font-semibold mb-4">Conversations</h2><p className="text-gray-500">No conversations yet</p></div>}
    </div>
  );
}
