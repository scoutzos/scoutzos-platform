import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const property_id = searchParams.get('property_id');

    let query = supabaseAdmin
      .from('work_orders')
      .select(`
        *,
        property:properties(address_line1, city, state),
        unit:units(unit_number),
        tenant_profile:tenant_profiles(first_name, last_name),
        vendor:vendors(company_name)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (property_id) query = query.eq('property_id', property_id);

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
      .from('work_orders')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
