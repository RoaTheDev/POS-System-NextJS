import {create} from 'zustand'
import {Timestamp} from 'firebase/firestore'
import {ProductType} from "@/lib/types/productType";


export interface Customer {
    id: string
    customerId: string
    name: string
    phone: number
    address: string
    createdAt: Timestamp
}

export interface CartItem {
    productId: string
    productName: string
    quantity: number
    price: number
    stock: number
}

export interface Sale {
    id?: string
    saleId: string
    customerId: string
    customerName?: string
    products: {
        productId: string
        productName?: string
        quantity: number
        price: number
    }[]
    totalAmount: string
    paymentMethod: string
    saleDate: Timestamp
}

interface SalesStore {
    // Cart state
    cart: CartItem[]
    addToCart: (product: ProductType, quantity: number) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getTotal: () => number

    // Recent sales
    recentSales: Sale[]
    setRecentSales: (sales: Sale[]) => void
    addSale: (sale: Sale) => void

    selectedCustomer: Customer | null
    setSelectedCustomer: (customer: Customer | null) => void
}

export const useSalesStore = create<SalesStore>((set, get) => ({
    cart: [],
    addToCart: (product, quantity) => {
        set((state) => {
            const existingItem = state.cart.find(item => item.productId === product.productId);

            if (existingItem) {
                const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
                return {
                    cart: state.cart.map(item =>
                        item.productId === product.productId
                            ? { ...item, quantity: newQuantity }
                            : item
                    ),
                };
            } else {
                const validQuantity = Math.min(quantity, product.stock);
                return {
                    cart: [
                        ...state.cart,
                        {
                            productId: product.productId,
                            productName: product.productName,
                            quantity: validQuantity,
                            price: product.price,
                            stock: product.stock,
                        },
                    ],
                };
            }
        });
    },
    removeFromCart: (productId) => {
        set((state) => ({
            cart: state.cart.filter(item => item.productId !== productId)
        }))
    },
    updateQuantity: (productId, quantity) => {
        set((state) => ({
            cart: state.cart.map(item =>
                item.productId === productId
                    ? {...item, quantity: quantity}
                    : item
            )
        }))
    },
    clearCart: () => {
        set({cart: []})
    },
    getTotal: () => {
        return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    recentSales: [],
    setRecentSales: (sales) => {
        set({recentSales: sales})
    },
    addSale: (sale) => {
        set((state) => ({
            recentSales: [sale, ...state.recentSales].slice(0, 10)
        }))
    },

    selectedCustomer: null,
    setSelectedCustomer: (customer) => {
        set({selectedCustomer: customer})
    }
}))