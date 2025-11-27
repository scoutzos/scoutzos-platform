import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Deal } from '@/types/deals';

export async function GET() {
    const supabase = createClient();

    const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(deals);
}

export async function POST(request: Request) {
    const supabase = createClient();
    const body = await request.json();

    // Get current user to determine tenant_id
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, we'd fetch the user's tenant_id from the users table
    // For now, we'll assume the user has a tenant_id in their metadata or we fetch it
    // This is a simplification for the implementation
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

    if (userError || !userData) {
        return NextResponse.json({ error: 'User tenant not found' }, { status: 400 });
    }

    const newDeal = {
        ...body,
        tenant_id: userData.tenant_id,
        status: 'new',
        photos: body.photos || [],
    };

    const { data, error } = await supabase
        .from('deals')
        .insert(newDeal)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
