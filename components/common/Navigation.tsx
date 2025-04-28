// components/Navigation.tsx
'use client'

import {usePathname, useRouter} from 'next/navigation'
import {Home, LogOut, Package, ShoppingCart, User} from 'lucide-react'
import {theme} from '@/lib/colorPattern'
import {useAuth} from '@/lib/stores/AuthContext'

export default function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const {logout, user} = useAuth()

    // Define navigation items
    const navItems = [
        {name: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard'},
        {name: 'products', label: 'Products', icon: Package, path: '/products'},
        {name: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales'},
    ]

    // Determine active page based on current pathname
    const activePage = navItems.find(item => pathname === item.path)?.name || 'dashboard'

    const handleLogout = async () => {
        await logout()
    }

    const Sidebar = () => (
        <div
            className="hidden lg:block w-64 h-full bg-white shadow-lg"
            style={{backgroundColor: theme.light}}
        >
            <div className="p-4">
                <h1 className="text-xl font-bold" style={{color: theme.primary}}>
                    Elizabeth Rose POS
                </h1>
            </div>
            <nav className="p-4">
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.name}>
                            <button
                                onClick={() => router.push(item.path)}
                                className={`flex w-full items-center p-3 rounded-lg ${
                                    activePage === item.name ? 'text-white' : 'hover:bg-opacity-10 hover:bg-gray-100'
                                }`}
                                style={{
                                    backgroundColor: activePage === item.name ? theme.primary : 'transparent',
                                    color: activePage === item.name ? 'white' : theme.text,
                                }}
                            >
                                <item.icon className="mr-3" size={20}/>
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="absolute bottom-0 w-64 p-4 border-t" style={{borderColor: theme.secondary}}>
                <div className="flex items-center">
                    <div
                        className="w-10 h-10 rounded-full mr-3 flex items-center justify-center"
                        style={{backgroundColor: theme.secondary}}
                    >
                        <User size={20} style={{color: theme.primary}}/>
                    </div>
                    <div>
                        <p className="font-medium" style={{color: theme.text}}>
                            {user?.email?.split('@')[0] || 'Staff User'}
                        </p>
                        <button
                            className="text-sm flex items-center"
                            style={{color: theme.primary}}
                            onClick={handleLogout}
                        >
                            <LogOut size={14} className="mr-1"/>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const MobileBottomNav = () => (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex justify-around items-center h-16"
            style={{backgroundColor: theme.light, borderColor: theme.secondary}}
        >
            {navItems.map(item => (
                <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className="flex flex-col items-center justify-center w-1/3 h-full"
                >
                    <item.icon
                        size={24}
                        style={{color: activePage === item.name ? theme.primary : theme.text}}
                    />
                    <span
                        className="text-xs mt-1"
                        style={{color: activePage === item.name ? theme.primary : theme.text}}
                    >
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
    )

    return (
        <>
            <Sidebar/>
            <MobileBottomNav/>
        </>
    )
}