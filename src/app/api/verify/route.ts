import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    const { sessionId, signature, userId } = await request.json();

    if (!sessionId || !userId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Signature (Stubbed)
    // In real app: verify(nonce, signature, publicKey)
    const isValid = true;

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Mark Check-in as Verified
    const { error: checkinError } = await supabase
        .from('checkins')
        .update({
            status: 'verified',
            user_id: userId
        })
        .eq('session_id', sessionId);

    if (checkinError) {
        return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    // 3. Allocate Room
    // Find a vacant room
    const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('room_no')
        .eq('status', 'vacant')
        .limit(1)
        .single();

    let assignedRoom = null;

    if (roomData) {
        assignedRoom = roomData.room_no;
        // Mark room as occupied
        await supabase
            .from('rooms')
            .update({
                status: 'occupied',
                user_id: userId,
                updated_at: new Date().toISOString()
            })
            .eq('room_no', assignedRoom);

        // Link room to checkin
        await supabase
            .from('checkins')
            .update({ room_no: assignedRoom })
            .eq('session_id', sessionId);
    } else {
        // Handle no rooms available case if needed
    }

    return NextResponse.json({
        success: true,
        room: assignedRoom
    });
}
