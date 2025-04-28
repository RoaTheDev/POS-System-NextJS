'use client'

import { theme } from '@/lib/colorPattern'

export default function LoadingScreen() {
    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center z-50"
            style={{ backgroundColor: theme.background }}
        >
            <div className="text-center">
                <div className="mb-5">
                    <div className="relative">
                        {/* Spinner animation */}
                        <div
                            className="w-16 h-16 rounded-full border-4 border-transparent animate-spin"
                            style={{
                                borderTopColor: theme.primary,
                                borderRightColor: theme.accent,
                            }}
                        />

                        {/* Center logo */}
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                        >
              <span
                  className="text-xl font-bold"
                  style={{ color: theme.primary }}
              >
                ER
              </span>
                        </div>
                    </div>
                </div>

                <h2
                    className="text-xl font-medium mb-1"
                    style={{ color: theme.primary }}
                >
                    Elizabeth Rose
                </h2>

                <p
                    className="text-sm opacity-80"
                    style={{ color: theme.text }}
                >
                    Loading your experience...
                </p>
            </div>
        </div>
    )
}