import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role for managing rooms (Checkout)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function GET() {
    // 1. Fetch all rooms
    const { data: rooms, error } = await supabaseAdmin
        .from('rooms')
        .select('*')
        .order('room_no', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
    // 2. Checkout (Vacate Room)
    const { room_no } = await request.json();

    if (!room_no) return NextResponse.json({ error: 'Missing room_no' }, { status: 400 });

    // 1. Mark Check-in as checked_out
    await supabaseAdmin
        .from('checkins')
        .update({ status: 'checked_out', updated_at: new Date().toISOString() })
        .eq('room_no', room_no)
        .eq('status', 'verified');

    // 2. Mark Room as vacant
    const { error } = await supabaseAdmin
        .from('rooms')
        .update({ status: 'vacant', updated_at: new Date().toISOString() })
        .eq('room_no', room_no);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
