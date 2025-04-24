import {Inter} from 'next/font/google'
import type {Metadata} from 'next'
import {Toaster} from '@/components/ui/sonner'
import './globals.css'
import React from "react";

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'Elizabeth Rose POS',
    description: 'Point of Sale system with Rose Blood Flame theme',
}

export default function RootLayout({children}: { children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        {children}
        <Toaster/>
        </body>
        </html>
    )
}