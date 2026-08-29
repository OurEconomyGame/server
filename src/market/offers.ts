import {
	getAllOffersByCompany as dbGetAllOffersByCompany,
	getAllOffersByResource as dbGetAllOffersByResource,
	type OfferRecord,
} from "../db/gets.ts";

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
