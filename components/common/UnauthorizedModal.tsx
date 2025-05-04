'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/lib/colorPattern'

interface UnauthorizedModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
}

export default function UnauthorizedModal({ isOpen, onCloseAction }: UnauthorizedModalProps) {
    const router = useRouter()
    const { logout } = useAuth()

    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCloseAction();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isOpen, onCloseAction]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleGoHome = () => {
        router.push('/sales');
        onCloseAction();
    };

    const handleLogout = async () => {
        await logout();
        onCloseAction();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
                        onClick={onCloseAction}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div
                            className="relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ backgroundColor: theme.light }}
                        >
                            <div className="h-2" style={{ backgroundColor: theme.primary }}></div>

                            <button
                                onClick={onCloseAction}
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-opacity-10 hover:bg-black transition-all duration-200"
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>

                            <div className="p-8">
                                <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full" style={{ backgroundColor: `${theme.secondary}30` }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        <path d="M12 8v4"></path>
                                        <path d="M12 16h.01"></path>
                                    </svg>
                                </div>

                                <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: theme.primary }}>
                                    Access Denied
                                </h2>

                                <p className="text-center mb-8" style={{ color: theme.text }}>
                                    {"You don't have permission to access this page. Please contact your administrator if you believe this is an error."}
                                </p>

                                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                                    <button
                                        onClick={handleGoHome}
                                        className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                        style={{
                                            backgroundColor: theme.primary,
                                            color: 'white',
                                        }}
                                    >
                                        Go to Home
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: theme.dark,
                                            border: `1px solid ${theme.accent}`
                                        }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}