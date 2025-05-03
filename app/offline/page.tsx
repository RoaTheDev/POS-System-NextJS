'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { theme } from '@/lib/colorPattern'
import { WifiOff, RefreshCcw } from 'lucide-react'

export default function Offline() {
    const router = useRouter()

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: theme.background }}
        >
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 relative mb-6">
                        <div
                            className="absolute inset-0 rounded-full opacity-20 animate-pulse"
                            style={{ backgroundColor: theme.primary }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <WifiOff
                                size={64}
                                style={{ color: theme.primary }}
                                className="animate-bounce"
                            />
                        </div>
                    </div>

                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{ color: theme.primary }}
                    >
                        {"You're offline"}
                    </h1>

                    <p
                        className="text-lg mb-8"
                        style={{ color: theme.text }}
                    >
                        {"It seems you've lost your internet connection. Please check your connection and try again."}
                    </p>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: theme.primary,
                            color: theme.light,
                            borderColor: theme.primary
                        }}
                    >
                        <RefreshCcw size={16} />
                        Try Again
                    </Button>
                </div>

                <p
                    className="mt-6 text-sm opacity-70"
                    style={{ color: theme.text }}
                >
                    Mai Sophany Sound
                </p>
            </div>
        </div>
    )
}