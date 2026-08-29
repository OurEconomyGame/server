import { getCompanyById } from "../db/gets.ts";
import { insertOffer } from "../db/inserts.ts";
import { getNextOfferId } from "./ids.ts";
import { matchSellOrders } from "./match.ts";
import { addCompanyCash, deductCompanyResource } from "./settle.ts";
import type { SellResult } from "./types.ts";

/**
 * Executes a sell offer for a company, matching against existing buy orders.
 */
export async function executeSell(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<SellResult> {
	const seller = await getCompanyById(company_id);
	if (!seller)
		return {
			success: false,
			error: "Company not found",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};
	const inv = (seller.data?.inventory ?? {}) as Record<number, number>;
	if ((inv[resource] ?? 0) < quantity)
		return {
			success: false,
			error: "Insufficient company inventory",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};

	await deductCompanyResource(company_id, resource, quantity);
	const { remaining, totalEarnings } = await matchSellOrders(
		company_id,
		resource,
		quantity,
		unitPrice,
	);

	if (totalEarnings > 0) await addCompanyCash(company_id, totalEarnings);

	let restingOfferId: number | undefined;
	if (remaining > 0) {
		restingOfferId = await getNextOfferId();
		await insertOffer(
			restingOfferId,
			company_id,
			resource,
			remaining,
			unitPrice,
		);
	}

	return {
		success: true,
		filledQuantity: quantity - remaining,
		remainingQuantity: remaining,
		restingOfferId,
	};
}
