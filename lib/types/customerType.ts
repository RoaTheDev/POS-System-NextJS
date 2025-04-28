import {Timestamp} from "firebase/firestore";

export interface Customer {
    id: string
    customerId: string
    name: string
    phone: number
    address: string
    createdAt: Timestamp
}