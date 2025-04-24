'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/products')
  }, [router])

  return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#FF4B6A" }}>Elizabeth Rose POS</h1>
          <p className="mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
  )
}