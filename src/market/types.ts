/**
 * Represents a market buy order placed by a company.
 */
export interface OrderRecord {
	id: number;
	company_id: number;
	resource: number;
	quantity: number;
	unitPrice: number;
}

/**
 * Represents a market sell offer placed by a company.
 */
export interface OfferRecord {
	id: number;
	company_id: number;
	resource: number;
	quantity: number;
	unitPrice: number;
}

export interface BuyResult {
	success: boolean;
	error?: string | undefined;
	filledQuantity: number;
	remainingQuantity: number;
	restingOrderId?: number | undefined;
}

export interface SellResult {
	success: boolean;
	error?: string | undefined;
	filledQuantity: number;
	remainingQuantity: number;
	restingOfferId?: number | undefined;
}
