'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './upload.css';

export default function UploadAadhaar() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Drag & Drop Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleContinue = () => {
        if (file) {
            console.log('Uploading file:', file.name);
            // Simulate validation/upload time then show success
            setTimeout(() => {
                setIsVerified(true);
            }, 500);
        }
    };

    // Auto-redirect after verification animation
    useEffect(() => {
        if (isVerified) {
            const timer = setTimeout(() => {
                router.push('/register-face');
            }, 2500); // Wait for animation to finish + delay
            return () => clearTimeout(timer);
        }
    }, [isVerified, router]);

    return (
        <main className="upload-container">
            <div className="upload-card">

                {/* Conditional Header - Hide if verified for cleaner look, or keep? Keeping for now but maybe hiding Back button? */}
                {!isVerified && (
                    <div className="upload-header">
                        <button className="back-button" onClick={() => router.back()}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <h1 className="upload-title">Upload Identity</h1>
                    </div>
                )}

                {!isVerified ? (
                    <>
                        <p className="upload-subtitle">Please upload your masked Aadhaar card to verify your identity.</p>

                        {/* Upload Zone */}
                        {!file ? (
                            <div
                                className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={handleClick}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />

                                {/* Cloud Upload Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>

                                <div>
                                    <p className="upload-text">Drag & drop or Click to browse</p>
                                    <p className="upload-subtext">Supports PDF, JPG, PNG</p>
                                </div>
                            </div>
                        ) : (
                            /* File Preview State */
                            <div className="upload-zone" style={{ padding: '20px', borderStyle: 'solid', borderColor: '#bfdbfe', background: '#eff6ff' }}>
                                <div className="file-preview">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="file-icon" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="file-info">
                                        <p className="file-name">{file.name}</p>
                                        <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button className="remove-btn" onClick={() => setFile(null)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="upload-subtext" style={{ marginTop: '10px' }}>File selected</p>
                            </div>
                        )}

                        <button
                            className="continue-button"
                            onClick={handleContinue}
                            disabled={!file}
                        >
                            Continue
                        </button>
                    </>
                ) : (
                    /* Success Animation */
                    <div className="success-container">
                        <div className="success-glow">
                            <svg className="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <h2 className="verified-text">User Verified!</h2>
                    </div>
                )}

            </div>
        </main>
    );
}
