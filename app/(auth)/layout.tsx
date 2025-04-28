'use client'

import Navigation from '@/components/common/Navigation'
import {theme} from '@/lib/colorPattern'
import {useAuth} from '@/lib/stores/AuthContext'
import LoadingScreen from '@/components/common/LoadingScreen'
import React from "react";

export default function AuthenticatedLayout({children}: {
    children: React.ReactNode
}) {
    const {loading} = useAuth()

    if (loading) {
        return <LoadingScreen/>
    }

    return (
        <div className="flex h-screen">
            <Navigation/>
            <main
                className="flex-1 overflow-auto p-2 lg:p-8 pb-52 lg:pb-8 mb-10 sm:mb-1"
                style={{ backgroundColor: theme.background }}
            >
                {children}
            </main>

        </div>
    )
}