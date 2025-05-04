'use client'

import {useAuth, UserRole} from '@/lib/stores/AuthContext'
import {usePathname, useRouter} from 'next/navigation'
import React, {useEffect} from 'react'
import LoadingScreen from './LoadingScreen'

interface RoleProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    redirectTo?: string;
}

export default function ProtectedRoute({
                                               children,
                                               allowedRoles = ['user', 'admin'],
                                               redirectTo = '/unauthorized'
                                           }: RoleProtectedRouteProps) {
    const {user, userWithRole, loading} = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user && pathname !== '/login') {
            router.push('/login')
        }

        if (!loading && user && pathname === '/login') {
            router.push('/sales')
        }

        if (!loading && user && userWithRole &&
            !allowedRoles.includes(userWithRole.role) &&
            pathname !== '/login' &&
            pathname !== redirectTo) {
            router.push(redirectTo)
        }
    }, [user, userWithRole, loading, router, pathname, allowedRoles, redirectTo])

    if (loading) {
        return <LoadingScreen/>
    }

    if (pathname === '/login') {
        return <>{children}</>
    }

    if (user && userWithRole && allowedRoles.includes(userWithRole.role)) {
        return <>{children}</>
    }

    return <LoadingScreen/>
}