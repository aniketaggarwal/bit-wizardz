import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    const { sessionId } = await request.json();

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const nonce = crypto.randomUUID();

    const { error } = await supabase
        .from('checkins')
        .update({
            nonce: nonce,
            status: 'pending_verification' // Update status
        })
        .eq('session_id', sessionId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ nonce });
}
