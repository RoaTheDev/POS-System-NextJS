'use client'

import {theme} from '@/lib/colorPattern'

export default function LoadingScreen() {
    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-90"
            style={{ backgroundColor: theme.background }}
        >
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    {/* Outer spinning circle */}
                    <div
                        className="w-20 h-20 rounded-full border-4 border-t-transparent border-r-transparent animate-spin"
                        style={{
                            borderLeftColor: theme.primary,
                            borderBottomColor: theme.accent,
                        }}
                    />

                    {/* Inner pulsating dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="w-6 h-6 rounded-full animate-ping"
                            style={{ backgroundColor: theme.primary }}
                        />
                    </div>
                </div>

                {/* Loading Title */}
                <h2
                    className="text-2xl font-bold animate-fade-in"
                    style={{ color: theme.primary }}
                >
                    Mai Sophany Sound
                </h2>

                {/* Loading Subtitle */}
                <p
                    className="text-sm opacity-80 animate-fade-in-delay"
                    style={{ color: theme.text }}
                >
                    Loading your experience...
                </p>
            </div>
        </div>
    )
}
