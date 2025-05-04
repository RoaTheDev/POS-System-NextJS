'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UnauthorizedModal from '@/components/common/UnauthorizedModal'
import { theme } from '@/lib/colorPattern'

export default function UnauthorizedPage() {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = () => {
        setIsModalOpen(false)
        router.push('/sales')
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.background }}>
            <div className="fixed top-0 left-0 w-full h-64 opacity-10" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})` }}></div>
            <div className="fixed bottom-0 right-0 w-full h-64 opacity-10" style={{ background: `linear-gradient(315deg, ${theme.accent}, ${theme.primary})` }}></div>

            <UnauthorizedModal
                isOpen={isModalOpen}
                onCloseAction={handleCloseModal}
            />
        </div>
    )
}