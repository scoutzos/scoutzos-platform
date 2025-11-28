import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const { data: buyBoxes, error } = await supabase
        .from('buy_boxes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(buyBoxes);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch tenant_id (simplified)
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

    if (userError || !userData) {
        return NextResponse.json({ error: 'User tenant not found' }, { status: 400 });
    }

    const newBuyBox = {
        ...body,
        tenant_id: userData.tenant_id,
        user_id: user.id,
    };

    const { data, error } = await supabase
        .from('buy_boxes')
        .insert(newBuyBox)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
