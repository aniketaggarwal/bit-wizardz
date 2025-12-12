import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to verify ECDSA signature (Server-side Node.js)
// Using Web Crypto API available in Next.js Edge/Server runtime.
const verifySignature = async (publicKeyB64: string, data: string, signatureB64: string) => {
    try {
        console.log('[Verify] Starting verification...');

        // 1. Import Public Key
        const jwkStr = atob(publicKeyB64);
        console.log('[Verify] JWK String:', jwkStr.substring(0, 50) + '...');
        const jwk = JSON.parse(jwkStr);

        const key = await crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['verify']
        );

        // 2. Decode Signature & Data
        const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
        console.log('[Verify] Signature Length:', signature.length); // Should be 64
        const dataBytes = new TextEncoder().encode(data);
        console.log('[Verify] Data to verify:', data);

        // 3. Verify
        const result = await crypto.subtle.verify(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            key,
            signature,
            dataBytes
        );
        console.log('[Verify] Result:', result);
        return result;
    } catch (e) {
        console.error('Server verify error:', e);
        return false;
    }
};

// Need Service Role Key to bypass RLS for administrative updates
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('[API] Critical: SUPABASE_SERVICE_ROLE_KEY is missing!');
            return NextResponse.json({ error: 'Server Misconfiguration: Missing Service Key' }, { status: 500 });
        }

        // Initialize Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
        );

        const body = await request.json();
        const { signature, nonce, session_id, public_key, guest_name } = body;

        if (!signature || !nonce || !session_id || !public_key || !guest_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify the Signature
        const isValid = await verifySignature(public_key, nonce, signature);

        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid Signature' }, { status: 401 });
        }

        // 1.5 Check if Guest is already checked in (Prevent Double Booking)
        const { data: existingCheckin } = await supabaseAdmin
            .from('checkins')
            .select('session_id, room_no')
            .eq('guest_name', guest_name)
            .eq('status', 'verified')
            .maybeSingle();

        if (existingCheckin) {
            return NextResponse.json({
                success: false,
                error: `Already checked in! Room: ${existingCheckin.room_no || 'Unknown'}`
            }, { status: 409 });
        }

        // 2. Allocate Room (Auto-assign vacant room)
        const { data: roomData } = await supabaseAdmin
            .from('rooms')
            .select('room_no')
            .eq('status', 'vacant')
            .order('room_no', { ascending: true })
            .limit(1)
            .single();

        let allocatedRoom = null;
        if (roomData) {
            allocatedRoom = roomData.room_no;
            // Mark Room as Occupied
            await supabaseAdmin
                .from('rooms')
                .update({
                    status: 'occupied',
                    updated_at: new Date().toISOString(),
                    user_id: null // We could store guest_name or user_id here if we had it
                })
                .eq('room_no', allocatedRoom);
        }

        // 3. Update Check-in Status in DB (Using Admin Client)
        const { data: updatedData, error: checkinError } = await supabaseAdmin
            .from('checkins')
            .update({
                status: 'verified',
                verified_at: new Date().toISOString(),
                room_no: allocatedRoom, // Associate room with checkin
                guest_name: guest_name
            })
            .eq('session_id', session_id)
            .select();

        if (checkinError) {
            console.error('DB Update Error:', checkinError);
            return NextResponse.json({ error: 'Database Update Failed: ' + checkinError.message }, { status: 500 });
        }

        if (!updatedData || updatedData.length === 0) {
            console.error('[API] Session ID not found:', session_id);
            return NextResponse.json({ error: 'Session Not Found (Double Check QR)' }, { status: 404 });
        }

        // 4. Log the check-in
        console.log(`[API] Verification Success for Session ${session_id}. Room: ${allocatedRoom}`);

        return NextResponse.json({ success: true, message: 'Verified', room: allocatedRoom });

    } catch (e) {
        console.error('[API] Verify Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
