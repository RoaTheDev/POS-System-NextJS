'use client'

import React, {createContext, useContext, useEffect, useState} from 'react'
import {onAuthStateChanged, signInWithEmailAndPassword, signOut, User} from 'firebase/auth'
import {auth} from '@/lib/firebase'
import {useRouter} from 'next/navigation'

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    error: string | null
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {
    },
    logout: async () => {
    },
    error: null
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (email: string, password: string) => {
        setError(null)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            router.push('/products')
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
        }
    }

    const logout = async () => {
        setError(null)
        try {
            await signOut(auth)
            router.push('/login')
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unknown error occurred')
            }
        }
    }

    return (
        <AuthContext.Provider value={{user, loading, login, logout, error}}>
            {children}
        </AuthContext.Provider>
    )
}