import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const property_id = searchParams.get('property_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = supabaseAdmin
      .from('showings')
      .select(`
        *,
        lead:leads(first_name, last_name, email, phone),
        property:properties(address_line1, city, state),
        unit:units(unit_number)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('scheduled_at', { ascending: true });

    if (status) query = query.eq('status', status);
    if (property_id) query = query.eq('property_id', property_id);
    if (start_date) query = query.gte('scheduled_at', start_date);
    if (end_date) query = query.lte('scheduled_at', end_date);

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
      .from('showings')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
