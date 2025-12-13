'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import FaceScanner from '@/components/FaceScanner';
import { loadEncryptedEmbeddings } from '@/lib/encryption';
import { verifyFaceMatch } from '@/lib/face-util';
import { getPrivateKey, getPublicKey } from '@/lib/auth-crypto';
import { fetchNonce, signNonce, sendVerification } from '@/lib/checkin-auth';
import ProfileDropdown from '@/components/ProfileDropdown';
import '../login.css';

interface RegisteredFace {
    name: string;
    descriptor: Float32Array;
}

export default function CheckInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Standard State
    const [faces, setFaces] = useState<RegisteredFace[]>([]);

    // Secure Check-in flow state
    const [checkinStep, setCheckinStep] = useState<'scan-qr' | 'scan-face' | 'verifying-server' | 'complete'>('scan-qr');
    const [sessionId, setSessionId] = useState('');
    const [nonce, setNonce] = useState('');
    const [matchedName, setMatchedName] = useState('');
    const [activeCard, setActiveCard] = useState<1 | 2 | 3>(1);

    // Review Mode State for Step 2
    const [isReviewing, setIsReviewing] = useState(false);
    const [tempMatchName, setTempMatchName] = useState('');
    const [scannerKey, setScannerKey] = useState(0); // To reset scanner

    useEffect(() => {
        loadEncryptedEmbeddings().then(setFaces);
        const urlSession = searchParams.get('session_id');
        if (urlSession) {
            setSessionId(urlSession);
            setTimeout(() => {
                handleAutoStart(urlSession);
            }, 500);
        }
    }, [searchParams]);

    const handleAutoStart = async (sid: string) => {
        const fetchedNonce = await fetchNonce(sid);
        if (fetchedNonce) {
            setNonce(fetchedNonce);
            setCheckinStep('scan-face');
            setActiveCard(2);
        } else {
            alert('Failed to fetch challenge from server. Check network.');
            setCheckinStep('scan-qr');
            setActiveCard(1);
        }
    };

    // 1. QR Scan
    const handleQrScan = async () => {
        if (!sessionId) {
            alert('Enter a Session ID');
            return;
        }
        await handleAutoStart(sessionId);
    };

    // 2. Face Scan Captured
    const handleFaceCapture = async (liveDescriptor: Float32Array) => {
        // Just verify locally to see if valid, but don't send yet
        let bestMatchName = '';
        for (const face of faces) {
            if (verifyFaceMatch(face.descriptor, liveDescriptor, 0.45)) {
                bestMatchName = face.name;
                break;
            }
        }

        if (bestMatchName) {
            setTempMatchName(bestMatchName);
            setIsReviewing(true); // Freeze and show buttons
        } else {
            // If unknown, maybe auto-retry or show error?
            // For now, let's allow retaking
            alert("No match found. Please try again.");
            setScannerKey(prev => prev + 1);
        }
    };

    // 2b. Cancel/Retake
    const handleRetake = () => {
        setIsReviewing(false);
        setTempMatchName('');
        setScannerKey(prev => prev + 1); // Reset scanner
    };

    // 2c. Confirm -> Proceed to Step 3
    const handleConfirmFace = async () => {
        setMatchedName(tempMatchName);
        setCheckinStep('verifying-server');
        setActiveCard(3); // Move to Step 3

        // Execute server verification
        await processServerVerification(tempMatchName);
    };

    // 3. Process Verification
    const processServerVerification = async (nameToVerify: string) => {
        try {
            const publicKey = await getPublicKey();
            const privateKey = await getPrivateKey();

            if (!privateKey || !publicKey) {
                alert('Device keys missing!');
                setCheckinStep('scan-face');
                setActiveCard(2);
                setIsReviewing(false);
                return;
            }

            const signature = await signNonce(privateKey, nonce);

            if (signature) {
                // Simulate delay for effect
                await new Promise(r => setTimeout(r, 1500));

                const { success, error, room } = await sendVerification(signature, nonce, sessionId, publicKey, nameToVerify);
                if (success) {
                    if (room) localStorage.setItem('guest_room', room);
                    localStorage.setItem('guest_name', nameToVerify);
                    localStorage.setItem('guest_session', sessionId);

                    setCheckinStep('complete');
                    setTimeout(() => {
                        router.push('/guest');
                    }, 2500); // 2.5s to admire the tick
                } else {
                    alert(`Verification Failed: ${error}`);
                    setCheckinStep('scan-face');
                    setActiveCard(2);
                    handleRetake();
                }
            } else {
                alert('Signing failed.');
                setCheckinStep('scan-face');
                setActiveCard(2);
                handleRetake();
            }
        } catch (e) {
            console.error(e);
            alert('Error during verification.');
            setCheckinStep('scan-face');
            setActiveCard(2);
            handleRetake();
        }
    };

    return (
        <main
            className="min-h-screen relative flex flex-col"
            style={{
                background: "linear-gradient(rgba(20, 0, 50, 0.85), rgba(60, 10, 100, 0.8)), url('/city-life.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'var(--text-color)',
                overflow: 'hidden'
            }}
        >
            <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '80px', flexShrink: 0 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: 60 }}></div>
                    <div className="header-brand" style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}>FastInn</div>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <ProfileDropdown />
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">

                {/* Header Title */}
                <div className="relative text-center mb-8 w-full">
                    <BackButton />
                    <h1 style={{
                        fontFamily: 'var(--font-brand)',
                        fontSize: 48,
                        fontWeight: 400,
                        margin: 0,
                        textShadow: '0 0 20px rgba(138, 43, 226, 0.5)',
                        letterSpacing: '6px',
                        color: '#fff'
                    }}>
                        SECURE CHECK-IN
                    </h1>
                </div>

                {/* Horizontal Cards Container - Compact & Transparent */}
                <div className="flex flex-row gap-4 w-full items-start transition-all duration-500">

                    {/* --- Step 1: Scan QR --- */}
                    <div
                        className={`step-card ${activeCard === 1 ? 'active luminous-border' : 'inactive'}`}
                        style={{ flex: activeCard === 1 ? 2 : 1 }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="step-title" style={{ color: 'var(--primary-color)' }}>1. Booking</h2>
                            {activeCard > 1 && <span className="text-green-400 font-bold text-xl">✓</span>}
                        </div>

                        {activeCard === 1 && (
                            <div className="animate-fadeIn flex flex-col gap-3">
                                <p className="text-gray-200 text-sm">Scan booking QR or enter ID.</p>
                                <div className="dialogue-input-group">
                                    <input
                                        type="text"
                                        placeholder="Session ID..."
                                        className="dialogue-input"
                                        value={sessionId}
                                        onChange={e => setSessionId(e.target.value)}
                                    />
                                    <button onClick={handleQrScan} className="dialogue-btn">
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeCard !== 1 && <div className="text-gray-400 text-xs mt-1">Completed</div>}
                    </div>

                    {/* --- Step 2: Face Scan --- */}
                    <div
                        className={`step-card ${activeCard === 2 ? 'active luminous-border' : 'inactive'}`}
                        style={{ flex: activeCard === 2 ? 3 : 1 }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="step-title" style={{ color: 'var(--primary-color)' }}>2. Verify Face</h2>
                            {activeCard > 2 && <span className="text-green-400 font-bold text-xl">✓</span>}
                        </div>

                        {activeCard === 2 && (
                            <div className="animate-fadeIn flex flex-col items-center relative w-full">
                                {/* Scanner Container - Compact */}
                                <div className="relative w-full aspect-video bg-black/20 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                                    <FaceScanner key={scannerKey} onScan={handleFaceCapture} />

                                    {/* Overlay Status */}
                                    {!isReviewing && (
                                        <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
                                            <span className="bg-black/40 text-cyan-300 px-3 py-0.5 rounded-md text-xs font-mono border border-cyan-500/20 backdrop-blur-sm"
                                                style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                                                Scanning...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Review Buttons (Manual Confirm) */}
                                {isReviewing && (
                                    <div className="flex gap-3 mt-4 animate-slideUp w-full justify-center">
                                        <button
                                            onClick={handleRetake}
                                            className="px-4 py-1.5 bg-red-500/10 text-red-300 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors text-sm font-semibold"
                                        >
                                            Retake
                                        </button>
                                        <button
                                            onClick={handleConfirmFace}
                                            className="px-4 py-1.5 bg-green-500/10 text-green-300 border border-green-500/30 rounded hover:bg-green-500/20 transition-colors text-sm font-semibold shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                )}
                                {!isReviewing && <p className="mt-2 text-gray-400 text-xs animate-pulse">Position face in frame</p>}
                            </div>
                        )}
                    </div>

                    {/* --- Step 3: Finalize --- */}
                    <div
                        className={`step-card ${activeCard === 3 ? 'active luminous-border' : 'inactive'}`}
                        style={{ flex: activeCard === 3 ? 2 : 1 }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="step-title" style={{ color: 'var(--primary-color)' }}>3. Finalize</h2>
                        </div>

                        {activeCard === 3 && (
                            <div className="animate-fadeIn flex flex-col items-center justify-center py-6">
                                {checkinStep === 'complete' ? (
                                    <div className="flex flex-col items-center">
                                        <div className="success-checkmark scale-75">
                                            <div className="check-icon">
                                                <span className="icon-line line-tip"></span>
                                                <span className="icon-line line-long"></span>
                                                <div className="icon-circle"></div>
                                                <div className="icon-fix"></div>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mt-4 font-castellar tracking-widest text-shadow-glow" style={{ color: 'var(--secondary-color)' }}>AUTHORIZED</h3>
                                        <p className="text-green-400 mt-1 text-sm font-mono">Redirecting...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin h-8 w-8 border-2 border-cyan-400 rounded-full border-t-transparent shadow-[0_0_10px_#22d3ee]" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent', boxShadow: '0 0 10px var(--primary-color)' }}></div>
                                        <span className="text-cyan-200 text-sm tracking-wide" style={{ color: 'var(--primary-color)' }}>Verifying...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <style jsx>{`
                .step-card {
                    /* Transparent & Glassy */
                    background: rgba(255, 255, 255, 0.02); /* Extremely subtle fill */
                    border: 1px solid rgba(138, 43, 226, 0.2); /* Violet Border */
                    border-radius: 1rem;
                    padding: 1.25rem;
                    overflow: hidden;
                    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
                    display: flex;
                    flex-direction: column;
                    min-height: 140px; /* Minimal height */
                    backdrop-filter: blur(4px); /* Light blur */
                }
                .step-card.active {
                    background: rgba(138, 43, 226, 0.1); /* Violet Tint when active */
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5); /* Subtle depth */
                }
                .step-card.inactive {
                    opacity: 0.5;
                    pointer-events: none;
                    background: transparent;
                    border-color: rgba(255,255,255,0.05);
                }
                .step-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.9);
                    white-space: nowrap;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.5px;
                }
                
                /* Dialogue Input Style */
                .dialogue-input-group {
                    display: flex;
                    gap: 8px;
                    border: 1px solid rgba(138, 43, 226, 0.4);
                    padding: 4px;
                    border-radius: 8px;
                    background: rgba(0,0,0,0.4);
                }
                .dialogue-input {
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 6px 10px;
                    width: 100%;
                    outline: none;
                    font-family: monospace;
                    font-size: 0.9rem;
                }
                .dialogue-btn {
                    background: var(--primary-color);
                    color: black;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 16px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .dialogue-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 0 10px var(--primary-color);
                }

                .font-castellar {
                    font-family: var(--font-brand);
                }
                .text-shadow-glow {
                     text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
                }

                /* Luminous Border Animation - Thinner & Cleaner */
                @keyframes borderRotate {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .luminous-border {
                    position: relative;
                    z-index: 0;
                    border-color: transparent; /* Handled by pseudo */
                }
                .luminous-border::before {
                    content: "";
                    position: absolute;
                    z-index: -2;
                    inset: -1px; /* Thinner glow */
                    border-radius: 1.05rem;
                    /* Cosmic Gradient: Electric Blue -> Violet -> Gold -> Electric Blue */
                    background: linear-gradient(90deg, #7DF9FF, #8A2BE2, #FFD700, #7DF9FF);
                    background-size: 300% 300%;
                    animation: borderRotate 4s linear infinite;
                    opacity: 0.8;
                }
                .luminous-border::after {
                    content: "";
                    position: absolute;
                    z-index: -1;
                    inset: 0px;
                    background: linear-gradient(to bottom, rgba(15, 5, 24, 0.95), rgba(20, 10, 30, 0.9));
                    border-radius: 1rem;
                }

                /* Tick Animation */
                .success-checkmark {
                    width: 80px;
                    height: 115px;
                    margin: 0 auto;
                }
                .check-icon {
                    width: 80px;
                    height: 80px;
                    position: relative;
                    border-radius: 50%;
                    box-sizing: content-box;
                    border: 4px solid #4CAF50;
                }
                .check-icon::before {
                    top: 3px; left: -2px; width: 30px; transform-origin: 100% 50%; border-radius: 100px 0 0 100px;
                }
                .check-icon::after {
                    top: 0; left: 30px; width: 60px; transform-origin: 0 50%; border-radius: 0 100px 100px 0;
                    animation: rotate-circle 4.25s ease-in;
                }
                .icon-line {
                    height: 5px; background-color: #4CAF50; display: block; border-radius: 2px; position: absolute; z-index: 10;
                }
                .line-tip {
                    top: 46px; left: 14px; width: 25px; transform: rotate(45deg);
                    animation: icon-line-tip 0.75s;
                }
                .line-long {
                    top: 38px; right: 8px; width: 47px; transform: rotate(-45deg);
                    animation: icon-line-long 0.75s;
                }
                .icon-circle {
                    top: -4px; left: -4px; z-index: 10; width: 80px; height: 80px; border-radius: 50%; position: absolute; box-sizing: content-box; border: 4px solid rgba(76, 175, 80, .5);
                }
                .icon-fix {
                    top: 8px; width: 5px; left: 26px; z-index: 1; height: 85px; position: absolute; transform: rotate(-45deg);
                }
                @keyframes icon-line-tip {
                    0% { width: 0; left: 1px; top: 19px; }
                    54% { width: 0; left: 1px; top: 19px; }
                    70% { width: 50px; left: -8px; top: 37px; }
                    84% { width: 17px; left: 21px; top: 48px; }
                    100% { width: 25px; left: 14px; top: 46px; }
                }
                @keyframes icon-line-long {
                    0% { width: 0; right: 46px; top: 54px; }
                    65% { width: 0; right: 46px; top: 54px; }
                    84% { width: 55px; right: 0px; top: 35px; }
                    100% { width: 47px; right: 8px; top: 38px; }
                }
            `}</style>
        </main>
    );
}

