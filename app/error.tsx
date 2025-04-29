'use client'

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {theme} from '@/lib/colorPattern'
import {AlertTriangle, Home, RefreshCcw} from 'lucide-react'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    const router = useRouter()

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
            style={{backgroundColor: theme.background}}
        >
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto w-32 h-32 sm:w-40 sm:h-40 relative mb-6">
                        <div
                            className="absolute inset-0 rounded-full opacity-20 animate-pulse"
                            style={{backgroundColor: theme.primary}}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <AlertTriangle
                                size={64}
                                style={{color: theme.primary}}
                                className="animate-bounce"
                            />
                        </div>
                    </div>

                    <h1
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{color: theme.primary}}
                    >
                        Something went wrong
                    </h1>

                    <p
                        className="text-lg mb-8"
                        style={{color: theme.text}}
                    >
                        {" We're sorry, but we encountered an error while processing your request."}
                    </p>
                </div>

                {error.message && (
                    <Alert
                        className="mb-6 border"
                        style={{
                            backgroundColor: `${theme.light}`,
                            borderColor: theme.accent,
                            color: theme.text
                        }}
                    >
                        <AlertTitle className="font-semibold" style={{color: theme.primary}}>
                            Error Details
                        </AlertTitle>
                        <AlertDescription className="mt-2 text-sm overflow-auto max-h-32">
                            {error.message}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: theme.accent,
                            color: theme.light,
                            borderColor: theme.accent
                        }}
                    >
                        <RefreshCcw size={16}/>
                        Try Again
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
                        <Home size={16}/>
                        Go to Home
                    </Button>
                </div>

                {error.digest && (
                    <p
                        className="mt-4 text-xs"
                        style={{color: theme.text}}
                    >
                        Error ID: {error.digest}
                    </p>
                )}

                <p
                    className="mt-6 text-sm opacity-70"
                    style={{color: theme.text}}
                >
                    Mai Sophany Sound
                </p>
            </div>
        </div>
    )
}