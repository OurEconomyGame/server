import {
	getAllOffersByCompany as dbGetAllOffersByCompany,
	getAllOffersByResource as dbGetAllOffersByResource,
	type OfferRecord,
} from "../db/gets.ts";
import { insertOffer } from "../db/inserts.ts";
import { getNextOfferId } from "./ids.ts";

/**
 * Retrieves all sell offers for a resource, sorted from lowest to highest price.
 *
 * @param resource - The resource enum identifier.
 * @returns Sorted array of matching OfferRecords.
 */
export async function getAllOffersByResource(
	resource: number,
): Promise<OfferRecord[]> {
	return dbGetAllOffersByResource(resource);
}

/**
 * Retrieves all sell offers placed by a specific company.
 *
 * @param company_id - The numeric company ID.
 * @returns Array of OfferRecords placed by the company.
 */
export async function getAllOffersByCompany(
	company_id: number,
): Promise<OfferRecord[]> {
	return dbGetAllOffersByCompany(company_id);
}

/**
 * Creates and inserts a new sell offer with sequential ID generation.
 *
 * @param company_id - Company placing the offer.
 * @param resource - Resource enum ID.
 * @param quantity - Quantity of units to sell.
 * @param unitPrice - Asking price per unit.
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
