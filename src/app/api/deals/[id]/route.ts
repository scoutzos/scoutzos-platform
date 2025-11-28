import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin, getTenantIdForUser } from '@/lib/supabase/admin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const { data: deal, error } = await supabaseAdmin.from('deals').select('*').eq('id', id).eq('tenant_id', tenantId).single();
        if (error) return NextResponse.json({ error: error.code === 'PGRST116' ? 'Deal not found' : 'Failed to fetch deal' }, { status: error.code === 'PGRST116' ? 404 : 500 });
        return NextResponse.json({ deal });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const body = await request.json();
        delete body.id; delete body.tenant_id; delete body.created_at;

        const { data: deal, error } = await supabaseAdmin.from('deals').update(body).eq('id', id).eq('tenant_id', tenantId).select().single();
        if (error) return NextResponse.json({ error: error.code === 'PGRST116' ? 'Deal not found' : 'Failed to update deal' }, { status: error.code === 'PGRST116' ? 404 : 500 });
        return NextResponse.json({ deal });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const tenantId = await getTenantIdForUser(user.id);
        if (!tenantId) return NextResponse.json({ error: 'User not associated with a tenant' }, { status: 403 });

        const { error } = await supabaseAdmin.from('deals').delete().eq('id', id).eq('tenant_id', tenantId);
        if (error) return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
