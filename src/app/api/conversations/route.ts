import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lead_id = searchParams.get('lead_id');
    const tenant_profile_id = searchParams.get('tenant_profile_id');
    const vendor_id = searchParams.get('vendor_id');
    const channel = searchParams.get('channel');

    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        lead:leads(first_name, last_name),
        tenant_profile:tenant_profiles(first_name, last_name),
        vendor:vendors(company_name)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (tenant_profile_id) query = query.eq('tenant_profile_id', tenant_profile_id);
    if (vendor_id) query = query.eq('vendor_id', vendor_id);
    if (channel) query = query.eq('channel', channel);

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
      .from('conversations')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
