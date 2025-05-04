'use client'

import React, {createContext, useContext, useEffect, useState} from 'react'
import {onAuthStateChanged, signInWithEmailAndPassword, signOut, User} from 'firebase/auth'
import {auth, db} from '@/lib/firebase'
import {useRouter} from 'next/navigation'
import {doc, getDoc, setDoc} from 'firebase/firestore'

export type UserRole = 'user' | 'admin'

type ExtendedUser = {
    uid: string;
    email: string | null;
    role: UserRole;
}

type AuthContextType = {
    user: User | null
    userWithRole: ExtendedUser | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    error: string | null
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userWithRole: null,
    loading: true,
    login: async () => {
    },
    logout: async () => {
    },
    error: null,
    isAdmin: false
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [userWithRole, setUserWithRole] = useState<ExtendedUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter()

    const fetchUserRole = async (user: User) => {
        try {
            const userRef = doc(db, 'users', user.uid)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    role: 'user'
                })
            }
            if (userSnap.exists()) {
                const userData = userSnap.data()
                const role = userData.role as UserRole || 'user'

                setUserWithRole({
                    uid: user.uid,
                    email: user.email,
                    role: role
                })

                setIsAdmin(role === 'admin')
            } else {
                setUserWithRole({
                    uid: user.uid,
                    email: user.email,
                    role: 'user'
                })
                setIsAdmin(false)
            }
        } catch (err) {
            console.error('Error fetching user role:', err)
            setUserWithRole({
                uid: user.uid,
                email: user.email,
                role: 'user'
            })
            setIsAdmin(false)
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user)

            if (user) {
                await fetchUserRole(user)
            } else {
                setUserWithRole(null)
                setIsAdmin(false)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (email: string, password: string) => {
        setError(null)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            router.push('/sales')
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
        <AuthContext.Provider value={{
            user,
            userWithRole,
            loading,
            login,
            logout,
            error,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    )
}