"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import CameraFeed from "../../components/CameraFeed";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
            } else {
                setUser(user);
            }
        };
        checkUser();
    }, [router]);

    if (!user) return null;

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>BIT WIZARDZ</h1>
                <p>Biometric Identity Terminal</p>
                <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.5 }}>
                    OPERATOR: {user.email || user.phone}
                </div>
            </header>

            <main>
                <CameraFeed />
            </main>

            <footer className="app-footer">
                <p>SECURE CONNECTION ESTABLISHED</p>
                <button
                    onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
                    style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', marginTop: '10px', cursor: 'pointer' }}
                >
                    TERMINATE SESSION
                </button>
            </footer>
        </div>
    );
}
