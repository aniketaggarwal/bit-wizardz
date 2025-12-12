import { supabase } from './supabase';

/**
 * Generates the full URL for the check-in session.
 * This URL is what should be encoded in the QR code.
 */
export const getSessionQrUrl = (sessionId: string): string => {
    // Ensure we are on the client to get window.location, otherwise return relative
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/checkin?session_id=${sessionId}`;
};

/**
 * Subscribes to real-time updates for a specific check-in session.
 * 
 * @param sessionId - The unique session ID to monitor
 * @param onUpdate - Callback function triggered when status changes
 * @returns cleanup function to unsubscribe
 */
export const monitorCheckinStatus = (
    sessionId: string,
    onUpdate: (status: string, payload: any) => void
) => {
    const channel = supabase
        .channel(`checkin-${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE', // Listen for UPDATE, not INSERT (since we create it pending)
                schema: 'public',
                table: 'checkins',
                filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
                if (payload.new.status === 'verified') {
                    onUpdate('verified', payload.new);
                }
            }
        )
        .subscribe();

    // Return cleanup function
    return () => {
        supabase.removeChannel(channel);
    };
};

/**
 * Simple poller if Realtime is not enabled/preferred.
 * Checks status every X ms.
 */
export const pollCheckinStatus = (
    sessionId: string,
    onStatusFound: (data: any) => void,
    intervalMs = 3000
) => {
    const interval = setInterval(async () => {
        const { data, error } = await supabase
            .from('checkins')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (data && !error && data.status === 'verified') {
            onStatusFound(data);
            clearInterval(interval);
        }
    }, intervalMs);

    return () => clearInterval(interval);
};
