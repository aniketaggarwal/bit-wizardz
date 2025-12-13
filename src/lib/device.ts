import { supabase } from './supabase';

export const getDeviceId = (): string => {
    if (typeof window === 'undefined') return '';

    let deviceId = localStorage.getItem('bit_wizardz_device_id');
    if (!deviceId) {
        deviceId = `device_${crypto.randomUUID()}`;
        localStorage.setItem('bit_wizardz_device_id', deviceId);
    }
    return deviceId;
};

/**
 * Checks if the user is locked to this device.
 * If not locked, locks to this device.
 * If locked to another, returns false (BLOCK).
 */
export const enforceDeviceLock = async (userId: string): Promise<boolean> => {
    const currentDeviceId = getDeviceId();
    if (!currentDeviceId) return true; // Should not happen in browser

    try {
        // Switch to 'users' table to consolidate data. 'profiles' might be missing.
        const { data, error } = await supabase
            .from('users')
            .select('locked_device_id')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            // Postgres error 42703: column does not exist
            if (error.code === '42703') {
                console.warn('Device Lock Skipped: Missing migration. Please run "add_locked_device_to_users.sql" in Supabase.');
            } else {
                console.error('Device Lock Error:', error);
            }
            // Fail open to prevent lockout if DB issue
            return true;
        }

        // 1. No Data (User row missing?) -> Allow (will be created in p1su)
        if (!data) return true;

        // 2. No Lock exists -> Set Lock
        if (!data.locked_device_id) {
            await supabase
                .from('users')
                .update({ locked_device_id: currentDeviceId })
                .eq('id', userId);
            return true;
        }

        // 3. Lock matches -> Allow
        if (data.locked_device_id === currentDeviceId) {
            return true;
        }

        // 4. Lock mismatch -> Block
        return false;

    } catch (e) {
        console.error('Device Lock Exception:', e);
        return true;
    }
};

/**
 * Clears the lock on logout
 */
export const unlockDevice = async (userId: string) => {
    await supabase.from('users').update({ locked_device_id: null }).eq('id', userId);
};
