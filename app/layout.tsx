// app/layout.tsx
import {Inter} from 'next/font/google'
import type {Metadata} from 'next'
import {Toaster} from '@/components/ui/sonner'
import './globals.css'
import React from 'react'
import {AuthProvider} from '@/lib/stores/AuthContext'
import ProtectedRoute from '@/components/common/ProtectedRoute'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'Mai Sophany Sound POS',
    description: 'POS for Electronic',
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <ProtectedRoute>
                {children}
            </ProtectedRoute>
        </AuthProvider>
        <Toaster/>
        </body>
        </html>
    )
}