import {
	getAllOrdersByCompany as dbGetAllOrdersByCompany,
	getAllOrdersByResource as dbGetAllOrdersByResource,
	type OrderRecord,
} from "../db/gets.ts";

/**
 * Retrieves all buy orders for a resource, sorted from highest to lowest price.
 *
 * @param resource - The resource enum identifier.
 * @returns Sorted array of matching OrderRecords.
 */
export async function getAllOrdersByResource(
	resource: number,
): Promise<OrderRecord[]> {
	return dbGetAllOrdersByResource(resource);
}

/**
 * Retrieves all buy orders placed by a specific company.
 *
 * @param company_id - The numeric company ID.
 * @returns Array of OrderRecords placed by the company.
 */
export async function getAllOrdersByCompany(
	company_id: number,
): Promise<OrderRecord[]> {
	return dbGetAllOrdersByCompany(company_id);
}
