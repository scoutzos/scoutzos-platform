import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = await createClient();

  // Get current user's org
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return null;
  const orgId = profile.organization_id;

  // Parallel queries for performance
  const [
    propertiesResult,
    tenantsResult,
    leasesResult,
    maintenanceResult,
    leadsResult,
    transactionsResult,
  ] = await Promise.all([
    // Total properties
    supabase
      .from('properties')
      .select('id, status, monthly_rent', { count: 'exact' })
      .eq('organization_id', orgId),

    // Active tenants
    supabase
      .from('tenants')
      .select('id, status', { count: 'exact' })
      .eq('organization_id', orgId)
      .eq('status', 'active'),

    // Active leases with rent info
    supabase
      .from('leases')
      .select('id, status, rent_amount, start_date, end_date')
      .eq('organization_id', orgId)
      .eq('status', 'active'),

    // Open maintenance requests
    supabase
      .from('maintenance_requests')
      .select('id, status, priority, created_at')
      .eq('organization_id', orgId)
      .in('status', ['open', 'in_progress']),

    // Recent leads
    supabase
      .from('leads')
      .select('id, status, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    // This month's transactions
    supabase
      .from('transactions')
      .select('id, amount, type, status, transaction_date')
      .eq('organization_id', orgId)
      .gte('transaction_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  // Calculate metrics
  const properties = propertiesResult.data || [];
  const vacantProperties = properties.filter(p => p.status === 'vacant').length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const occupancyRate = properties.length > 0
    ? Math.round((occupiedProperties / properties.length) * 100)
    : 0;

  const leases = leasesResult.data || [];
  const monthlyRevenue = leases.reduce((sum, l) => sum + (l.rent_amount || 0), 0);

  const transactions = transactionsResult.data || [];
  const collectedRent = transactions
    .filter(t => t.type === 'rent' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const maintenance = maintenanceResult.data || [];
  const urgentMaintenance = maintenance.filter(m => m.priority === 'emergency' || m.priority === 'high').length;

  const leads = leadsResult.data || [];
  const newLeads = leads.filter(l => l.status === 'new').length;

  // Leases expiring in 60 days
  const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const expiringLeases = leases.filter(l => {
    const endDate = new Date(l.end_date);
    return endDate <= sixtyDaysFromNow;
  }).length;

  return {
    totalProperties: properties.length,
    vacantProperties,
    occupiedProperties,
    occupancyRate,
    activeTenants: tenantsResult.count || 0,
    activeLeases: leases.length,
    monthlyRevenue,
    collectedRent,
    collectionRate: monthlyRevenue > 0 ? Math.round((collectedRent / monthlyRevenue) * 100) : 0,
    openMaintenance: maintenance.length,
    urgentMaintenance,
    newLeads,
    totalLeadsThisMonth: leads.length,
    expiringLeases,
  };
}

export async function getRecentActivity() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return [];
  const orgId = profile.organization_id;

  // Get recent items from each table
  const [maintenance, leads, leases] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select('id, title, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('leads')
      .select('id, first_name, last_name, status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('leases')
      .select('id, status, created_at, tenant:tenants(first_name, last_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Combine and sort by date
  const activities = [
    ...(maintenance.data || []).map(m => ({
      id: m.id,
      type: 'maintenance' as const,
      title: `Maintenance: ${m.title}`,
      status: m.status,
      date: m.created_at,
    })),
    ...(leads.data || []).map(l => ({
      id: l.id,
      type: 'lead' as const,
      title: `New Lead: ${l.first_name} ${l.last_name}`,
      status: l.status,
      date: l.created_at,
    })),
    ...(leases.data || []).map(l => ({
      id: l.id,
      type: 'lease' as const,
      title: `Lease: ${(l.tenant as any)?.first_name || 'Unknown'} ${(l.tenant as any)?.last_name || ''}`,
      status: l.status,
      date: l.created_at,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

export async function getUpcomingRent() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return [];

  const { data: leases } = await supabase
    .from('leases')
    .select(`
      id,
      rent_amount,
      rent_due_day,
      tenant:tenants(id, first_name, last_name, email),
      property:properties(id, name, address_line1)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'active')
    .order('rent_due_day', { ascending: true })
    .limit(10);

  return leases || [];
}
