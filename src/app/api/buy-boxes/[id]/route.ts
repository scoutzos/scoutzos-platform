import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = await createClient();

    const { data: buyBox, error } = await supabase
        .from('buy_boxes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: 'Buy Box not found' }, { status: 404 });
    }

    return NextResponse.json(buyBox);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
        .from('buy_boxes')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    const supabase = await createClient();

    const { error } = await supabase
        .from('buy_boxes')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Buy Box deleted' });
}
