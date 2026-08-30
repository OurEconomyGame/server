export interface WebStoreData {
	inventory?: Record<number, number>;
	food_price?: number;
	price?: number;
	[key: string]: unknown;
}

export interface StoreBuyResult {
	status: string;
	quantity?: number;
	price?: number;
	total_cost?: number;
	electricity_used?: number;
	buyer_cash?: number;
	store_cash?: number;
	[key: string]: unknown;
}

export interface NpcPurchaseResult {
	purchased: boolean;
	store_id?: number;
	store_name?: string;
	quantity?: number;
	price?: number;
	revenue?: number;
	electricity_used?: number;
	message?: string;
	[key: string]: unknown;
}
