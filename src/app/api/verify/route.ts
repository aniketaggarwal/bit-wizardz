import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to verify ECDSA signature (Server-side Node.js)
// We need to import the WebCrypto API if on Node < 15, but Next.js usually provides it.
// However, verifying raw ECDSA P-256 signatures in pure Node.js 'crypto' module 
// with a JWK/SPKI formatted public key can be tricky.
// We'll use the Web Crypto API available in the Next.js Edge/Server runtime.

const verifySignature = async (publicKeyB64: string, data: string, signatureB64: string) => {
    try {
        // 1. Import Public Key
        // The client sends JWK (JSON string -> Base64)
        const jwkStr = atob(publicKeyB64);
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
        const dataBytes = new TextEncoder().encode(data);

        // 3. Verify
        return await crypto.subtle.verify(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            key,
            signature,
            dataBytes
        );
    } catch (e) {
        console.error('Server verify error:', e);
        return false;
    }
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { signature, nonce, session_id, public_key } = body;

        if (!signature || !nonce || !public_key) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // 1. Verify the Signature
        const isValid = await verifySignature(public_key, nonce, signature);

        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid Signature' }, { status: 401 });
        }

        // 2. (Optional) Check Device against DB
        // const { data: device } = await supabase
        //    .from('devices')
        //    .select('*')
        //    .eq('public_key', public_key)
        //    .single();
        // if (!device) return NextResponse.json({ error: 'Unknown Device' }, { status: 403 });

        // 3. Log the check-in
        console.log(`[API] Verification Success for Session ${session_id}`);

        return NextResponse.json({ success: true, message: 'Verified' });

    } catch (e) {
        console.error('[API] Verify Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
