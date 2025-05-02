import { create } from 'zustand';

export interface Service {
    serviceId: string;
    serviceName: string;
    description: string;
    price: number;
}

export interface Customer {
    id?: string;
    customerId: string;
    name: string;
    phone: number;
    address?: string;
}

interface ServiceStore {
    services: Service[];
    selectedCustomer: Customer | null;
    addService: (service: Service) => void;
    removeService: (serviceId: string) => void;
    clearServices: () => void;
    getTotal: () => number;
    setSelectedCustomer: (customer: Customer | null) => void;
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
    services: [],
    selectedCustomer: null,

    addService: (service: Service) => {
        set((state) => ({
            services: [...state.services, service]
        }));
    },

    removeService: (serviceId: string) => {
        set((state) => ({
            services: state.services.filter((service) => service.serviceId !== serviceId)
        }));
    },

    clearServices: () => {
        set({ services: [] });
    },

    getTotal: () => {
        return get().services.reduce((total, service) => total + service.price, 0);
    },

    setSelectedCustomer: (customer: Customer | null) => {
        set({ selectedCustomer: customer });
    }
}));