import { create } from 'zustand';

interface AppError {
    message: string;
    code?: string;
    severity?: 'error' | 'warning';
}

interface ProductState {
    isLoading: boolean;
    error: AppError | null;
    setLoading: (loading: boolean) => void;
    setError: (error: AppError | null) => void;
    clearError: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
    isLoading: false,
    error: null,
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
}));