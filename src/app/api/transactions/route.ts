import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const property_id = searchParams.get('property_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        property:properties(address_line1, city, state),
        unit:units(unit_number),
        tenant_profile:tenant_profiles(first_name, last_name)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('transaction_date', { ascending: false });

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (property_id) query = query.eq('property_id', property_id);
    if (start_date) query = query.gte('transaction_date', start_date);
    if (end_date) query = query.lte('transaction_date', end_date);

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
