import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Generate a random 32-byte nonce
    const nonce = crypto.randomBytes(32).toString('hex');

    // In a real app, we would store this nonce against the session_id in the DB 
    // with an expiry to prevent replay attacks.
    // await redis.set(`nonce:${sessionId}`, nonce, 'EX', 60);

    return NextResponse.json({ nonce });
}
