import { deleteOfferById, deleteOrderById } from "../db/deletes.ts";
import { getOfferById, getOrderById } from "../db/gets.ts";
import { isCompanyCeo } from "./auth.ts";
import { addCompanyCash, addCompanyResource } from "./settle.ts";

export interface CancelPayload {
	company_id?: number;
	order_id?: number;
	offer_id?: number;
}

/**
 * Handles HTTP request to cancel a resting order or offer and return escrow.
 */
export async function handleMarketCancel(
	payload: unknown,
	auth_token: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = payload as CancelPayload;
	const companyId = Number(p.company_id);
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Missing or invalid company_id" };
	}

	const isCeo = await isCompanyCeo(auth_token, companyId);
	if (!isCeo) {
		return {
			status: "Only the CEO can cancel market orders for this company",
		};
	}

	if (typeof p.order_id === "number") {
		const order = await getOrderById(p.order_id);
		if (!order || order.company_id !== companyId) {
			return { status: "Order not found for this company" };
		}
		const refund = order.quantity * order.unitPrice;
		await addCompanyCash(companyId, refund);
		await deleteOrderById(order.id);
		return {
			status: "Success",
			cancelled: "order",
			id: order.id,
			refunded_cash: refund,
		};
	}

	if (typeof p.offer_id === "number") {
		const offer = await getOfferById(p.offer_id);
		if (!offer || offer.company_id !== companyId) {
			return { status: "Offer not found for this company" };
		}
		await addCompanyResource(companyId, offer.resource, offer.quantity);
		await deleteOfferById(offer.id);
		return {
			status: "Success",
			cancelled: "offer",
			id: offer.id,
			refunded_resource_qty: offer.quantity,
		};
	}

	return { status: "Provide either order_id or offer_id to cancel" };
}
