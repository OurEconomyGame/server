import { appendCompanyLog } from "../companies/helpers/logs.ts";
import {
	RESOURCE_NAMES,
	type Resources,
} from "../companies/production/resources.ts";
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
	const resName =
		RESOURCE_NAMES[resource as Resources] ?? `Resource ${resource}`;

	for (const offer of offers) {
		if (offer.unitPrice > unitPrice || remaining <= 0) break;
		if (offer.company_id === company_id) continue;

		const matchQty = Math.min(remaining, offer.quantity);
		const tradeCash = matchQty * offer.unitPrice;
		priceSurplus += matchQty * (unitPrice - offer.unitPrice);
		await addCompanyCash(offer.company_id, tradeCash);
		await deliverResource(company_id, resource, matchQty);

		await appendCompanyLog(
			company_id,
			`Bought ${matchQty} ${resName} for $${tradeCash} ($${offer.unitPrice}/unit)`,
		);
		await appendCompanyLog(
			offer.company_id,
			`Sold ${matchQty} ${resName} for $${tradeCash} ($${offer.unitPrice}/unit)`,
		);

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
	const resName =
		RESOURCE_NAMES[resource as Resources] ?? `Resource ${resource}`;

	for (const offer of offers) {
		if (offer.unitPrice > unitPrice || remaining <= 0) break;

		const matchQty = Math.min(remaining, offer.quantity);
		const tradeCash = matchQty * offer.unitPrice;
		priceSurplus += matchQty * (unitPrice - offer.unitPrice);
		await addCompanyCash(offer.company_id, tradeCash);
		await addUserResource(user_id, resource, matchQty);

		await appendCompanyLog(
			offer.company_id,
			`Sold ${matchQty} ${resName} to user ${user_id} for $${tradeCash} ($${offer.unitPrice}/unit)`,
		);

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
	const resName =
		RESOURCE_NAMES[resource as Resources] ?? `Resource ${resource}`;

	for (const order of orders) {
		if (order.unitPrice < unitPrice || remaining <= 0) break;
		if (order.company_id === company_id) continue;

		const matchQty = Math.min(remaining, order.quantity);
		const tradeCash = matchQty * order.unitPrice;
		totalEarnings += tradeCash;
		await deliverResource(order.company_id, resource, matchQty);

		await appendCompanyLog(
			company_id,
			`Sold ${matchQty} ${resName} for $${tradeCash} ($${order.unitPrice}/unit)`,
		);
		if (order.company_id > 0) {
			await appendCompanyLog(
				order.company_id,
				`Bought ${matchQty} ${resName} for $${tradeCash} ($${order.unitPrice}/unit)`,
			);
		}

		if (matchQty === order.quantity) {
			await deleteOrderById(order.id);
		} else {
			await updateOrderById(order.id, { quantity: order.quantity - matchQty });
		}
		remaining -= matchQty;
	}
	return { remaining, totalEarnings };
}
