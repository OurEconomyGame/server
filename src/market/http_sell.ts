import { getUserBySessionToken } from "../sessions/check.ts";
import { isCompanyCeo } from "./auth.ts";
import { executeSell, executeUserSell } from "./sell.ts";

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
 * Can be placed on behalf of a company (if company_id > 0) or by admin as a seller sink.
 */
export async function handleMarketSell(
	payload: unknown,
	auth_token: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as MarketSellPayload;
	const resource = Number(p.resource);
	const quantity = Number(p.quantity);
	const price = Number(p.unitPrice ?? p.price ?? p.min_price);

	if (!Number.isFinite(resource) || resource < 0)
		return { status: "Missing or invalid resource" };
	if (!Number.isFinite(quantity) || quantity <= 0)
		return { status: "Quantity must be greater than 0" };
	if (!Number.isFinite(price) || price <= 0)
		return { status: "Price must be greater than 0" };

	// 1. Company Sell Offer
	if (
		p.company_id !== undefined &&
		p.company_id !== null &&
		Number(p.company_id) > 0
	) {
		const companyId = Number(p.company_id);
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

	// 2. User Sell Sink Offer (Admin UID 0 only)
	if (!auth_token) {
		return { status: "Authentication token required" };
	}
	const user = await getUserBySessionToken(auth_token);
	if (!user || user.id !== 0) {
		return {
			status: "Only the admin (UID 0) can place user sell order sinks",
		};
	}

	const result = await executeUserSell(user.id, resource, quantity, price);
	if (!result.success) {
		return { status: result.error ?? "Failed to execute user sell offer" };
	}

	return {
		status: "Success",
		user_id: user.id,
		sink: true,
		filled_quantity: result.filledQuantity,
		remaining_quantity: result.remainingQuantity,
		resting_offer_id: result.restingOfferId,
	};
}
