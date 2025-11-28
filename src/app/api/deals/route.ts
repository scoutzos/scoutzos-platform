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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        let query = supabaseAdmin.from('deals').select('*', { count: 'exact' }).eq('tenant_id', tenantId);
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        const from = (page - 1) * limit;
        query = query.range(from, from + limit - 1);

        const { data: deals, error, count } = await query;
        if (error) return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
        return NextResponse.json({ deals: deals || [], pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const body = await request.json();
        const requiredFields = ['address_line1', 'city', 'state', 'zip', 'list_price', 'source'];
        for (const field of requiredFields) {
            if (!body[field]) return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
        }

        const { data: deal, error } = await supabaseAdmin.from('deals').insert({ tenant_id: tenantId, ...body, status: 'new' }).select().single();
        if (error) return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
        return NextResponse.json({ deal }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
