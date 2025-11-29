import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('work_orders')
      .select(`
        *,
        property:properties(*),
        unit:units(*),
        tenant_profile:tenant_profiles(*),
        vendor:vendors(*)
      `)
      .eq('id', params.id)
      .eq('tenant_id', TENANT_ID)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('work_orders')
      .update(body)
      .eq('id', params.id)
      .eq('tenant_id', TENANT_ID)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('work_orders')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', TENANT_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
