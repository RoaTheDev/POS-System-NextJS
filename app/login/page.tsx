'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/stores/AuthContext'
import { theme } from '@/lib/colorPattern'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const { login, error } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        try {
            await login(data.email, data.password)
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message || 'Login failed')
            } else {
                toast.error('Login failed')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: theme.background }}>
            <div className="md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center md:text-left">
                        <h1 className="text-4xl font-bold mb-2" style={{ color: theme.primary }}>
                            Sophany Sound
                        </h1>
                        <h2 className="text-xl font-medium" style={{ color: theme.text }}>
                            Point of Sale System
                        </h2>
                    </div>

                    {/* Logo container with similar styling as the error page icon */}
                    <div
                        className="w-full h-64 md:h-96 rounded-2xl shadow-lg mb-8 relative overflow-hidden"
                        style={{ backgroundColor: theme.light }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className="w-48 h-48 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${theme.secondary}20` }} // Adding transparency
                            >
                                <div
                                    className="w-40 h-40 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: theme.secondary }}
                                >
                                    <span className="text-5xl font-bold" style={{ color: theme.primary }}>MS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center md:text-left" style={{ color: theme.text }}>
                        <p className="mb-2 text-lg font-medium">Welcome back!</p>
                        <p className="opacity-80">Sign in to access your POS system.</p>
                    </div>
                </div>
            </div>

            {/* Right side: Login form */}
            <div className="md:w-1/2 flex justify-center items-center p-8 md:p-16">
                <Card className="w-full max-w-md" style={{ backgroundColor: theme.light }}>
                    <CardHeader>
                        <CardTitle className="text-2xl" style={{ color: theme.primary }}>
                            Staff Login
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert
                                className="mb-6 border"
                                style={{
                                    backgroundColor: `${theme.light}`,
                                    borderColor: theme.accent,
                                    color: theme.text
                                }}
                            >
                                <AlertDescription style={{ color: theme.primary }}>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" style={{ color: theme.text }}>
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        {...register('email')}
                                        className="pl-10"
                                        style={{
                                            borderColor: theme.secondary,
                                            backgroundColor: 'white',
                                            color: theme.text,
                                        }}
                                    />
                                    <svg
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={theme.text}
                                        strokeWidth="2"
                                        strokeOpacity="0.7"
                                    >
                                        <path
                                            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                {errors.email && (
                                    <p className="text-sm" style={{ color: theme.primary }}>
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" style={{ color: theme.text }}>
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••••"
                                        {...register('password')}
                                        className="pl-10"
                                        style={{
                                            borderColor: theme.secondary,
                                            backgroundColor: 'white',
                                            color: theme.text,
                                        }}
                                    />
                                    <svg
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={theme.text}
                                        strokeWidth="2"
                                        strokeOpacity="0.7"
                                    >
                                        <path d="M12 17v4m-6-8a6 6 0 0112 0v3H6v-3z" />
                                    </svg>
                                </div>
                                {errors.password && (
                                    <p className="text-sm" style={{ color: theme.primary }}>
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center"
                                style={{
                                    backgroundColor: theme.primary,
                                    color: theme.light,
                                    borderColor: theme.primary,
                                    opacity: isLoading ? 0.7 : 1,
                                }}
                            >
                                {isLoading ? (
                                    <span>Signing In...</span>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="ml-2" size={18} />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center" style={{ color: theme.text }}>
                            <p className="text-sm opacity-80">
                                Private system - Authorized personnel only
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}