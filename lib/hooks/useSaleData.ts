import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchSalesData, SalesDataResult } from '@/lib/services/saleDataServices';
import { SaleFilter, SalePagination, SaleHistory } from '@/lib/types/saleType';
import { Customer } from '@/lib/stores/saleStore';
import {fetchCustomers} from "@/lib/services/customerDataService";

interface UseSalesDataReturn {
    sales: SaleHistory[];
    customers: Record<string, Customer>;
    loading: boolean;
    pagination: SalePagination;
    availableCurrencies: string[];
    fetchPageData: (page: number) => Promise<void>;
    setItemsPerPage: (perPage: number) => void;
    refreshData: () => Promise<void>;
}

export function useSalesData(initialFilters: SaleFilter): UseSalesDataReturn {
    const [sales, setSales] = useState<SaleHistory[]>([]);
    const [customers, setCustomers] = useState<Record<string, Customer>>({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SaleFilter>(initialFilters);
    const [pagination, setPagination] = useState<SalePagination>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1
    });
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);

    useEffect(() => {
        const getCustomers = async () => {
            try {
                const customersData = await fetchCustomers();
                setCustomers(customersData);
            } catch (error) {
                console.error('Error fetching customers:', error);
                toast.error('Failed to load customer data');
                setCustomers({});
            }
        };
        getCustomers();
    }, []);

    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const fetchPageData = useCallback(
        async (page: number) => {
            try {
                setLoading(true);
                const result: SalesDataResult = await fetchSalesData(page, pagination.itemsPerPage, filters, customers);
                setSales(result.sales);
                setAvailableCurrencies(result.availableCurrencies);
                setPagination((prev) => ({
                    ...prev,
                    currentPage: page,
                    totalItems: result.totalItems,
                    totalPages: result.totalPages
                }));
            } catch (error) {
                console.error('Error loading sales data:', error);
                toast.error('Failed to load sales data');
                setSales([]);
            } finally {
                setLoading(false);
            }
        },
        [filters, pagination.itemsPerPage, customers]
    );

    useEffect(() => {
        fetchPageData(1);
    }, [filters, pagination.itemsPerPage, customers, fetchPageData]);

    const setItemsPerPage = useCallback((perPage: number) => {
        setPagination((prev) => ({
            ...prev,
            itemsPerPage: perPage,
            currentPage: 1
        }));
    }, []);

    const refreshData = useCallback(async () => {
        await fetchPageData(pagination.currentPage);
    }, [fetchPageData, pagination.currentPage]);

    return {
        sales,
        customers,
        loading,
        pagination,
        availableCurrencies,
        fetchPageData,
        setItemsPerPage,
        refreshData
    };
}