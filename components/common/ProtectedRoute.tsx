'use client'

import {useAuth} from '@/lib/stores/AuthContext'
import {usePathname, useRouter} from 'next/navigation'
import React, {useEffect} from 'react'
import LoadingScreen from './LoadingScreen'

export default function ProtectedRoute({
                                           children
                                       }: {
    children: React.ReactNode
}) {
    const {user, loading} = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // If not loading and no user, redirect to login
        if (!loading && !user && pathname !== '/login') {
            router.push('/login')
        }

        // If user is logged in and trying to access login page, redirect to products
        if (!loading && user && pathname === '/login') {
            router.push('/products')
        }
    }, [user, loading, router, pathname])

    // Show loading screen while checking auth state
    if (loading) {
        return <LoadingScreen/>
    }

    // If on login page or authenticated, render children
    if (pathname === '/login' || user) {
        return <>{children}</>
    }

    // Don't render anything during redirect
    return <LoadingScreen/>
}