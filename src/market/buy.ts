import { getCompanyById } from "../db/gets.ts";
import { insertOrder } from "../db/inserts.ts";
import { getNextOrderId } from "./ids.ts";
import { matchBuyOffers } from "./match.ts";
import { addCompanyCash } from "./settle.ts";
import type { BuyResult } from "./types.ts";

/**
 * Executes a buy order for a company, matching against existing sell offers.
 */
export async function executeBuy(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<BuyResult> {
	const buyer = await getCompanyById(company_id);
	if (!buyer)
		return {
			success: false,
			error: "Company not found",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};
	const totalMaxCost = quantity * unitPrice;
	if (buyer.cash < totalMaxCost)
		return {
			success: false,
			error: "Insufficient company cash",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};

	await addCompanyCash(company_id, -totalMaxCost);
	const { remaining, priceSurplus } = await matchBuyOffers(
		company_id,
		resource,
		quantity,
		unitPrice,
	);

	if (priceSurplus > 0) await addCompanyCash(company_id, priceSurplus);

	let restingOrderId: number | undefined;
	if (remaining > 0) {
		restingOrderId = await getNextOrderId();
		await insertOrder(
			restingOrderId,
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
		restingOrderId,
	};
}
