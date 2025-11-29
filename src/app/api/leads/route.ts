import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lead_type = searchParams.get('lead_type');
    const pipeline_stage = searchParams.get('pipeline_stage');
    const assigned_to = searchParams.get('assigned_to');

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        property:properties(address_line1, city, state),
        unit:units(unit_number)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (lead_type) query = query.eq('lead_type', lead_type);
    if (pipeline_stage) query = query.eq('pipeline_stage', pipeline_stage);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

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
      .from('leads')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
