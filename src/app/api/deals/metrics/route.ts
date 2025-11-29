import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, getTenantIdForUser } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const dealIds = searchParams.get('deal_ids');

        if (!dealIds) {
            return NextResponse.json({ error: 'deal_ids parameter required' }, { status: 400 });
        }

        const ids = dealIds.split(',').map(id => id.trim()).filter(Boolean);
        if (ids.length === 0) {
            return NextResponse.json({ metrics: [] });
        }

        // Verify deals belong to tenant
        const { data: deals } = await supabaseAdmin
            .from('deals')
            .select('id')
            .eq('tenant_id', tenantId)
            .in('id', ids);

        const validDealIds = (deals || []).map(d => d.id);

        if (validDealIds.length === 0) {
            return NextResponse.json({ metrics: [] });
        }

        // Fetch metrics for valid deals
        const { data: metrics, error } = await supabaseAdmin
            .from('deal_metrics')
            .select('deal_id, cap_rate, monthly_cash_flow, cash_on_cash, gross_yield')
            .in('deal_id', validDealIds);

        if (error) {
            console.error('Error fetching metrics:', error);
            return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
        }

        return NextResponse.json({ metrics: metrics || [] });
    } catch (error) {
        console.error('Metrics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
