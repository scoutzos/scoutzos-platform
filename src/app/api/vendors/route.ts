import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = supabaseAdmin
      .from('vendors')
      .select('*')
      .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
      .order('company_name', { ascending: true });

    if (status) query = query.eq('status', status);
    if (category) query = query.contains('categories', [category]);

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
      .from('vendors')
      .insert({ ...body, tenant_id: TENANT_ID })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
