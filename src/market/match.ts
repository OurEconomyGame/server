import { deleteOfferById, deleteOrderById } from "../db/deletes.ts";
import { updateOfferById, updateOrderById } from "../db/updates.ts";
import { getAllOffersByResource } from "./offers.ts";
import { getAllOrdersByResource } from "./orders.ts";
import {
	addCompanyCash,
	addUserResource,
	deliverResource,
} from "./settle.ts";

/**
 * Matches an incoming buy order (for a company) against existing sell offers.
 */
export async function matchBuyOffers(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<{ remaining: number; priceSurplus: number }> {
	let remaining = quantity;
	let priceSurplus = 0;
	const offers = await getAllOffersByResource(resource);

	for (const offer of offers) {
		if (offer.unitPrice > unitPrice || remaining <= 0) break;
		if (offer.company_id === company_id) continue;

		const matchQty = Math.min(remaining, offer.quantity);
		priceSurplus += matchQty * (unitPrice - offer.unitPrice);
		await addCompanyCash(offer.company_id, matchQty * offer.unitPrice);
		await deliverResource(company_id, resource, matchQty);

		if (matchQty === offer.quantity) {
			await deleteOfferById(offer.id);
		} else {
			await updateOfferById(offer.id, { quantity: offer.quantity - matchQty });
		}
		remaining -= matchQty;
	}
	return { remaining, priceSurplus };
}

/**
 * Matches an incoming user buy order (consumer sink) against existing sell offers.
 */
export async function matchBuyOffersForUser(
	user_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<{ remaining: number; priceSurplus: number }> {
	let remaining = quantity;
	let priceSurplus = 0;
	const offers = await getAllOffersByResource(resource);

	for (const offer of offers) {
		if (offer.unitPrice > unitPrice || remaining <= 0) break;

		const matchQty = Math.min(remaining, offer.quantity);
		priceSurplus += matchQty * (unitPrice - offer.unitPrice);
		await addCompanyCash(offer.company_id, matchQty * offer.unitPrice);
		await addUserResource(user_id, resource, matchQty);

		if (matchQty === offer.quantity) {
			await deleteOfferById(offer.id);
		} else {
			await updateOfferById(offer.id, { quantity: offer.quantity - matchQty });
		}
		remaining -= matchQty;
	}
	return { remaining, priceSurplus };
}

/**
 * Matches an incoming sell offer against existing buy orders.
 */
export async function matchSellOrders(
	company_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<{ remaining: number; totalEarnings: number }> {
	let remaining = quantity;
	let totalEarnings = 0;
	const orders = await getAllOrdersByResource(resource);

	for (const order of orders) {
		if (order.unitPrice < unitPrice || remaining <= 0) break;
		if (order.company_id === company_id) continue;

		const matchQty = Math.min(remaining, order.quantity);
		totalEarnings += matchQty * order.unitPrice;
		await deliverResource(order.company_id, resource, matchQty);

		if (matchQty === order.quantity) {
			await deleteOrderById(order.id);
		} else {
			await updateOrderById(order.id, { quantity: order.quantity - matchQty });
		}
		remaining -= matchQty;
	}
	return { remaining, totalEarnings };
}
