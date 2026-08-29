import {
	getAllOrdersByCompany as dbGetAllOrdersByCompany,
	getAllOrdersByResource as dbGetAllOrdersByResource,
	type OrderRecord,
} from "../db/gets.ts";
import { insertOrder } from "../db/inserts.ts";
import { getNextOrderId } from "./ids.ts";

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

/**
 * Creates and inserts a new buy order with sequential ID generation.
 *
 * @param company_id - Company placing the order.
 * @param resource - Resource enum ID.
 * @param quantity - Quantity of units to purchase.
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
