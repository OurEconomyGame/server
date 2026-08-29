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
