import {Customer} from "@/lib/stores/saleStore";
import {collection, getDocs, query} from "firebase/firestore";
import {db} from "@/lib/firebase";

export async function fetchCustomers(): Promise<Record<string, Customer>> {
    try {
        const customersQuery = query(collection(db, 'customers'));
        const customersSnapshot = await getDocs(customersQuery);
        const customersMap: Record<string, Customer> = {};

        customersSnapshot.docs.forEach((doc) => {
            const customerData = doc.data() as Omit<Customer, 'id'>;
            customersMap[customerData.customerId] = {
                id: doc.id,
                ...customerData
            };
        });

        return customersMap;
    } catch (error) {
        console.error('Error fetching customers data:', error);
        throw error;
    }
}