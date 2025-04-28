'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingScreen from '@/components/common/LoadingScreen'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        router.push('/products')
    }, [router])

    return <LoadingScreen />
}