'use client'

'use client'

import {usePathname, useRouter} from 'next/navigation'
import {Book, BookA, Package, ShoppingCart, User2} from 'lucide-react'
import {theme} from '@/lib/colorPattern'
import {useAuth} from '@/lib/stores/AuthContext'
import {useEffect, useRef} from 'react'

export default function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const {userWithRole} = useAuth()

    const lastValidPageRef = useRef<string | null>(null)

    const navItems = [
        {name: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales'},
        {name: 'service', label: 'Service', icon: BookA, path: '/serviceEntry'},
        {name: 'products', label: 'Products', icon: Package, path: '/products'},
        {name: 'customers', label: 'Customers', icon: User2, path: '/customers'},
        {name: 'ledger', label: 'Ledger', icon: Book, path: '/ledger'}
    ].filter(item => !(item.name === 'products' && userWithRole?.role === 'user'))

    const currentPage = navItems.find(item => pathname === item.path)?.name

    useEffect(() => {
        if (currentPage) {
            lastValidPageRef.current = currentPage
        }
    }, [currentPage])

    const activePage = currentPage || lastValidPageRef.current || navItems[0].name

    const Sidebar = () => (
        <div
            className="hidden lg:block w-64 h-full bg-white shadow-lg"
            style={{backgroundColor: theme.light}}
        >
            <div className="p-4">
                <h1 className="text-xl font-bold" style={{color: theme.primary}}>
                    Mai Sophany Sound
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