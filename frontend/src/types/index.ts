export interface User {
    id: number;
    firstname: string;
    lastname: string;
    fullname?: string;
    email: string;
    avatar_url?: string;
    phone_number?: string;
    has_wallet?: boolean;
    account_number?: string;
    account_name?: string;
    bank_name?: string;
    wallet_balance: number;
    email_verified: boolean;
    status: 'active' | 'suspended'; 
    created_at: string;
}

export interface WalletTransaction {
    id: number;
    amount: number;
    type: 'credit' | 'debit';
    status: 'pending' | 'success' | 'failed';
    reference: string;
    description: string;
    created_at: string;
}

export interface RidePayment {
    id: number;
    transaction_id: string;
    amount: number;
    ticket_count: number;
    status: 'completed' | 'reversed';
    driver_name?: string;
    driver_code?: string;
    created_at: string;
}

export interface Driver {
    name: string;
    code: string;
    vehicle_type: 'bus' | 'keke';
    vehicle_number: string;
}
