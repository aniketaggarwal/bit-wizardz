'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './login.css';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo(e.target.value);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  const handleLogin = async () => {
    const isPhone = /^\d{10}$/.test(contactInfo);
    // Allow standard email regex
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo);

    if (fullName && (isPhone || isEmail)) {
      setLoading(true);
      if (isPhone) {
        // Phone OTP
        const { error } = await supabase.auth.signInWithOtp({
          phone: `+91${contactInfo}`,
        });
        if (error) alert(error.message);
        else setStep('otp');
      } else {
        // Email + Password Login
        if (!password) {
          alert("Please enter your password.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: contactInfo,
          password: password,
        });

        if (error) {
          console.error(error);
          if (error.message.includes("Invalid login credentials")) {
            alert("Login failed. Redirecting to Sign Up.");
            router.push("/signup");
          } else {
            alert(error.message);
          }
        } else {
          // --- CONSTRAINT #2: Single Device Lock ---
          try {
            const { getDeviceId } = require('@/lib/device'); // Dynamic import for client-side safety
            const currentDeviceId = getDeviceId();
            const userId = data.user?.id;

            // 1. Check Lock Status
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('active_device_id')
              .eq('id', userId)
              .single();

            if (profile?.active_device_id && profile.active_device_id !== currentDeviceId) {
              // LOCKED: Block Login
              await supabase.auth.signOut();
              alert(`🚫 LOGIN BLOCKED\n\nYou are already logged in on another device.\nPlease logout from the other device first.`);
              setLoading(false);
              return;
            }

            // 2. Lock this Device (or re-affirm lock)
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                active_device_id: currentDeviceId,
                last_active: new Date().toISOString()
              });

            if (upsertError) throw upsertError;

            // 3. Check if user profile exists to decide redirect
            const { data: userProfile } = await supabase
              .from('users')
              .select('id_last4')
              .eq('id', userId)
              .single();

            if (userProfile?.id_last4) {
              router.push('/menu');
            } else {
              const name = data.user?.user_metadata?.name || 'User';
              router.push(`/p1su?name=${encodeURIComponent(name)}`);
            }

          } catch (lockError) {
            console.error('Lock Check Failed:', lockError);
            alert('Security Check Failed. Please try again.');
          }
        }
      }
      setLoading(false);
    } else {
      alert("Please enter a valid Name and Contact Info.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${contactInfo}`,
      token: otpValue,
      type: 'sms',
      is_mobile: false // Actually, type='sms' handles it
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <main className="login-container">

      {/* LEFT SIDE - BRANDING */}
      <div className="split-left">
        <div className="branding-content">
          <div className="logo-placeholder">
            {/* Custom "FI" Speed Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-16 w-16" fill="none" stroke="currentColor">
              <path
                d="M 20 20 L 60 20 L 55 35 L 30 35 L 25 50 L 50 50 L 45 65 L 20 65 Z"
                fill="white"
                stroke="none"
                style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))" }}
              />
              <path
                d="M 65 20 L 80 20 L 65 80 L 50 80 Z"
                fill="white"
                stroke="none"
                style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))" }}
              />
              {/* Speed Lines */}
              <path d="M 10 30 L 0 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 15 45 L 5 45" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              <path d="M 10 60 L 0 60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 85 30 L 95 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <path d="M 80 70 L 90 70" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            </svg>
          </div>
          <h1 className="brand-name">FastInn</h1>
          <p className="brand-tagline">Seamless Hotel Check-ins</p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="split-right">
        <div className="form-content">

          <div>
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Please enter your details to continue.</p>
          </div>

          {step === 'login' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              {/* Full Name Input */}
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="slick-input"
                  placeholder="e.g. John Doe"
                  maxLength={40}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Contact Input (Email) */}
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="text"
                  className="slick-input"
                  placeholder="name@example.com"
                  value={contactInfo}
                  onChange={handleContactChange}
                />
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="slick-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Login Buttons */}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Processing...' : 'Login to FastInn'}
              </button>

              <div className="text-center my-4 text-gray-500 text-sm">Or</div>

              <button type="button" className="google-button" onClick={handleGoogleLogin}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Login With Google
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
              {/* OTP View */}
              <div className="text-center mb-6">
                <p>Enter OTP sent to {contactInfo}</p>
                <div className="flex gap-2 justify-center mt-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      className="border p-2 w-10 text-center rounded text-black"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      maxLength={1}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="signup-text">
            Not a user? <Link href="/signup" className="signup-link">Sign Up!</Link>
          </div>

          {/* Quick Dashboard Access (Protected) */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const pin = prompt('Enter Admin Access Code:');
                if (pin === '1234') {
                  router.push('/dashboard');
                } else if (pin !== null) {
                  alert('⛔ Access Denied');
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-600 underline bg-transparent border-none cursor-pointer"
            >
              Go to Admin Dashboard
            </button>
          </div>

        </div>
      </div>

    </main>
  );
}
