import { isCompanyCeo } from "./auth.ts";
import { executeBuy } from "./buy.ts";

export interface MarketBuyPayload {
	company_id?: number;
	resource?: number;
	quantity?: number;
	price?: number;
	unitPrice?: number;
	max_price?: number;
}

/**
 * Handles HTTP request to place and execute a market buy order.
 */
export async function handleMarketBuy(
	payload: unknown,
	auth_token: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as MarketBuyPayload;
	const companyId = Number(p.company_id);
	const resource = Number(p.resource);
	const quantity = Number(p.quantity);
	const price = Number(p.unitPrice ?? p.price ?? p.max_price);

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
			status: "Only the CEO can place market orders for this company",
		};
	}

	const result = await executeBuy(companyId, resource, quantity, price);
	if (!result.success) {
		return { status: result.error ?? "Failed to execute buy order" };
	}

	return {
		status: "Success",
		filled_quantity: result.filledQuantity,
		remaining_quantity: result.remainingQuantity,
		resting_order_id: result.restingOrderId,
	};
}
