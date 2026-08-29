import {
	getAllOffersByCompany as dbGetAllOffersByCompany,
	getAllOffersByResource as dbGetAllOffersByResource,
	getAllOrdersByCompany as dbGetAllOrdersByCompany,
	getAllOrdersByResource as dbGetAllOrdersByResource,
	type OfferRecord,
	type OrderRecord,
} from "../db/gets.ts";
import { query } from "../db/init.ts";
import { insertOffer, insertOrder } from "../db/inserts.ts";

/**
 * Retrieves the next sequential order ID from the database.
 *
 * @returns Next available order ID (defaults to 1).
 */
export async function getNextOrderId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *order{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}

/**
 * Retrieves the next sequential offer ID from the database.
 *
 * @returns Next available offer ID (defaults to 1).
 */
export async function getNextOfferId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *offer{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}

/**
 * Retrieves all buy orders for a given resource, sorted from highest price to lowest price.
 *
 * @param resource - The resource ID (Resources enum value).
 * @returns Array of matching OrderRecords sorted descending by unitPrice.
 */
export async function getAllOrdersByResource(
	resource: number,
): Promise<OrderRecord[]> {
	return dbGetAllOrdersByResource(resource);
}

/**
 * Retrieves all sell offers for a given resource, sorted from lowest price to highest price.
 *
 * @param resource - The resource ID (Resources enum value).
 * @returns Array of matching OfferRecords sorted ascending by unitPrice.
 */
export async function getAllOffersByResource(
	resource: number,
): Promise<OfferRecord[]> {
	return dbGetAllOffersByResource(resource);
}

/**
 * Retrieves all buy orders placed by a specific company.
 *
 * @param company_id - Numeric ID of the company.
 * @returns Array of OrderRecords placed by the company.
 */
export async function getAllOrdersByCompany(
	company_id: number,
): Promise<OrderRecord[]> {
	return dbGetAllOrdersByCompany(company_id);
}

/**
 * Retrieves all sell offers placed by a specific company.
 *
 * @param company_id - Numeric ID of the company.
 * @returns Array of OfferRecords placed by the company.
 */
export async function getAllOffersByCompany(
	company_id: number,
): Promise<OfferRecord[]> {
	return dbGetAllOffersByCompany(company_id);
}

/**
 * Helper to create and insert a new buy order with automatic ID generation.
 *
 * @param company_id - Company placing the order.
 * @param resource - Resource ID.
 * @param quantity - Quantity of resource units.
 * @param unitPrice - Price per unit.
 * @returns Created OrderRecord or null on failure.
 */
export async function createOrder(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<OrderRecord | null> {
	const id = await getNextOrderId();
	const success = await insertOrder(
		id,
		company_id,
		resource,
		quantity,
		unitPrice,
	);
	if (!success) return null;
	return { id, company_id, resource, quantity, unitPrice };
}

/**
 * Helper to create and insert a new sell offer with automatic ID generation.
 *
 * @param company_id - Company placing the offer.
 * @param resource - Resource ID.
 * @param quantity - Quantity of resource units.
 * @param unitPrice - Price per unit.
 * @returns Created OfferRecord or null on failure.
 */
export async function createOffer(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<OfferRecord | null> {
	const id = await getNextOfferId();
	const success = await insertOffer(
		id,
		company_id,
		resource,
		quantity,
		unitPrice,
	);
	if (!success) return null;
	return { id, company_id, resource, quantity, unitPrice };
}
