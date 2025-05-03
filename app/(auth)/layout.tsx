'use client'

import React, { useState, useRef, useEffect } from "react"
import Navigation from '@/components/common/Navigation'
import { theme } from '@/lib/colorPattern'
import { useAuth } from '@/lib/stores/AuthContext'
import LoadingScreen from '@/components/common/LoadingScreen'
import { LogOut, User, X, Settings } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function AuthenticatedLayout({
                                                children
                                            }: {
    children: React.ReactNode
}) {
    const { loading, logout, user } = useAuth()
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
    const settingsMenuRef = useRef<HTMLDivElement>(null)

    // Close settings menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setSettingsMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (loading) {
        return <LoadingScreen />
    }

    const handleLogout = async () => {
        await logout()
        setLogoutDialogOpen(false)
    }

    const username = user?.email?.split('@')[0] || 'Staff User'
    const userInitial = username.charAt(0).toUpperCase()

    return (
        <div className="flex h-screen">
            <Navigation />

            <main
                className="flex-1 flex flex-col overflow-hidden sm:mb-2 mb-14"
                style={{ backgroundColor: theme.background }}
            >
                <header
                    className='shadow-md z-10 sticky top-0'
                    style={{ backgroundColor: theme.light }}
                >
                    <div className='px-4 py-3 flex items-center justify-between'>
                        <div className='lg:hidden'>
                            <h1
                                className='text-lg font-bold'
                                style={{ color: theme.primary }}
                            >
                                Mai Sophany Sound
                            </h1>
                        </div>

                        <div className='ml-auto flex items-center'>
                            {/* User info */}
                            <div className="flex items-center mr-4">
                                <div
                                    className='w-9 h-9 rounded-full flex items-center justify-center shadow-sm mr-3'
                                    style={{ backgroundColor: theme.secondary }}
                                >
                                    {userInitial ? (
                                        <span className="text-sm font-medium" style={{ color: theme.primary }}>
                                            {userInitial}
                                        </span>
                                    ) : (
                                        <User size={16} style={{ color: theme.primary }} />
                                    )}
                                </div>
                                <p
                                    className="font-medium text-lg"
                                    style={{ color: theme.text }}
                                >
                                    {username}
                                </p>
                            </div>

                            <div className="relative" ref={settingsMenuRef}>
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                                    onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                                    aria-label="Settings"
                                    style={{
                                        color: theme.primary,
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = `${theme.secondary}40`)}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <Settings size={20} />
                                </button>

                                {/* Settings dropdown */}
                                {settingsMenuOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-20"
                                        style={{ backgroundColor: theme.light }}
                                    >
                                        <button
                                            className="w-full text-left px-4 py-3 flex items-center transition-all"
                                            style={{ color: theme.text }}
                                            onClick={() => {
                                                setSettingsMenuOpen(false)
                                                setLogoutDialogOpen(true)
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = `${theme.secondary}40`}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <LogOut size={18} className="mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-3 lg:p-8 pb-24 lg:pb-8">
                    {children}
                </div>
            </main>

            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent
                    className="rounded-lg border-0 shadow-lg"
                    style={{ backgroundColor: theme.light }}
                >
                    <AlertDialogHeader>
                        <div className="flex items-center justify-between">
                            <AlertDialogTitle
                                className="text-xl font-bold"
                                style={{ color: theme.primary }}
                            >
                                Confirm Logout
                            </AlertDialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLogoutDialogOpen(false)}
                                className="h-6 w-6 rounded-full"
                                style={{ color: theme.text }}
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    </AlertDialogHeader>
                    <div className="pt-2">
                        <div className="flex flex-col items-center py-4">
                            <div
                                className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <LogOut size={32} style={{ color: theme.primary }} />
                            </div>
                            <p
                                className="text-center mb-2 font-medium"
                                style={{ color: theme.text }}
                            >
                                Are you sure you want to logout?
                            </p>
                            <p
                                className="text-center text-sm opacity-80"
                                style={{ color: theme.text }}
                            >
                                You will need to login again to access your account.
                            </p>
                        </div>
                    </div>
                    <AlertDialogFooter className="flex space-x-3">
                        <AlertDialogCancel
                            className="flex-1 border"
                            style={{
                                backgroundColor: "transparent",
                                borderColor: theme.accent,
                                color: theme.text
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1"
                            style={{
                                backgroundColor: theme.primary,
                                color: theme.light
                            }}
                            onClick={handleLogout}
                        >
                            Logout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}