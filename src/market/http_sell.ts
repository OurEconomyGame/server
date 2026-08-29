import { isCompanyCeo } from "./auth.ts";
import { executeSell } from "./sell.ts";

export interface MarketSellPayload {
	company_id?: number;
	resource?: number;
	quantity?: number;
	price?: number;
	unitPrice?: number;
	min_price?: number;
}

/**
 * Handles HTTP request to place and execute a market sell offer.
 */
export async function handleMarketSell(
	payload: unknown,
	auth_token: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as MarketSellPayload;
	const companyId = Number(p.company_id);
	const resource = Number(p.resource);
	const quantity = Number(p.quantity);
	const price = Number(p.unitPrice ?? p.price ?? p.min_price);

	if (!Number.isFinite(companyId) || companyId <= 0)
		return { status: "Missing or invalid company_id" };
	if (!Number.isFinite(resource) || resource < 0)
		return { status: "Missing or invalid resource" };
	if (!Number.isFinite(quantity) || quantity <= 0)
		return { status: "Quantity must be greater than 0" };
	if (!Number.isFinite(price) || price <= 0)
		return { status: "Price must be greater than 0" };

	const isCeo = await isCompanyCeo(auth_token, companyId);
	if (!isCeo) {
		return {
			status: "Only the CEO can place market offers for this company",
		};
	}

	const result = await executeSell(companyId, resource, quantity, price);
	if (!result.success) {
		return { status: result.error ?? "Failed to execute sell offer" };
	}

	return {
		status: "Success",
		filled_quantity: result.filledQuantity,
		remaining_quantity: result.remainingQuantity,
		resting_offer_id: result.restingOfferId,
	};
}
