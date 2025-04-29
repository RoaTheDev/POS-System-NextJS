'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { theme } from '@/lib/colorPattern'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    const router = useRouter()

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: theme.background }}
        >
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    {/* Custom 404 graphic using your theme colors */}
                    <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 relative mb-6">
                        <div
                            className="absolute inset-0 rounded-full opacity-20 animate-pulse"
                            style={{ backgroundColor: theme.primary }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
              <span
                  className="text-5xl sm:text-6xl font-extrabold"
                  style={{ color: theme.primary }}
              >
                404
              </span>
                        </div>
                    </div>

                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{ color: theme.primary }}
                    >
                        Page Not Found
                    </h1>

                    <p
                        className="text-lg mb-8"
                        style={{ color: theme.text }}
                    >
                        {"Sorry, we couldn't find the page you're looking for."}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => router.back()}
                        className="flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: theme.accent,
                            color: theme.light,
                            borderColor: theme.accent
                        }}
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </Button>

                    <Button
                        onClick={() => router.push('/')}
                        className="flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: theme.primary,
                            color: theme.light,
                            borderColor: theme.primary
                        }}
                    >
                        <Home size={16} />
                        Home
                    </Button>
                </div>

                <p
                    className="mt-8 text-sm opacity-70"
                    style={{ color: theme.text }}
                >
                    Mai Sophany Sound
                </p>
            </div>
        </div>
    )
}