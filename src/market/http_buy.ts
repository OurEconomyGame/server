import { getUserBySessionToken } from "../sessions/check.ts";
import { isCompanyCeo } from "./auth.ts";
import { executeBuy, executeUserBuy } from "./buy.ts";

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
 * Can be placed on behalf of a company (if company_id > 0) or by a user as a consumer sink.
 */
export async function handleMarketBuy(
	payload: unknown,
	auth_token: string | null,
): Promise<Record<string, unknown>> {
	if (!auth_token) {
		return { status: "Authentication token required" };
	}

	const user = await getUserBySessionToken(auth_token);
	if (!user) {
		return { status: "Invalid session token" };
	}

	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as MarketBuyPayload;
	const resource = Number(p.resource);
	const quantity = Number(p.quantity);
	const price = Number(p.unitPrice ?? p.price ?? p.max_price);

	if (!Number.isFinite(resource) || resource < 0)
		return { status: "Missing or invalid resource" };
	if (!Number.isFinite(quantity) || quantity <= 0)
		return { status: "Quantity must be greater than 0" };
	if (!Number.isFinite(price) || price <= 0)
		return { status: "Price must be greater than 0" };

	// 1. Company Buy Order
	if (
		p.company_id !== undefined &&
		p.company_id !== null &&
		Number(p.company_id) > 0
	) {
		const companyId = Number(p.company_id);
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

	// 2. User Consumer Sink Order (Admin UID 0 only)
	if (user.id !== 0) {
		return {
			status: "Only the admin (UID 0) can place user consumer buy sinks",
		};
	}

	const result = await executeUserBuy(user.id, resource, quantity, price);
	if (!result.success) {
		return { status: result.error ?? "Failed to execute user buy order" };
	}

	return {
		status: "Success",
		user_id: user.id,
		sink: true,
		filled_quantity: result.filledQuantity,
		remaining_quantity: result.remainingQuantity,
		resting_order_id: result.restingOrderId,
	};
}
