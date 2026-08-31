import { getCompanyById, getUserById } from "../db/gets.ts";
import { insertOffer } from "../db/inserts.ts";
import { getNextOfferId } from "./ids.ts";
import { matchSellOrders } from "./match.ts";
import {
	addCompanyCash,
	addUserCash,
	addUserResource,
	deductCompanyResource,
	deductUserResource,
} from "./settle.ts";
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

/**
 * Executes a sell offer for a user (admin sell sink), matching against existing buy orders.
 */
export async function executeUserSell(
	user_id: number,
	resource: number,
	quantity: number,
	unitPrice: number,
): Promise<SellResult> {
	const seller = await getUserById(user_id);
	if (!seller) {
		return {
			success: false,
			error: "User not found",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};
	}

	const inv = (((seller.data as Record<string, unknown>)?.inventory ??
		{}) as Record<number, number>);

	// Admin (UID 0) has infinite capability or personal inventory
	if (user_id === 0 && (inv[resource] ?? 0) < quantity) {
		await addUserResource(user_id, resource, quantity);
	} else if ((inv[resource] ?? 0) < quantity) {
		return {
			success: false,
			error: "Insufficient personal inventory",
			filledQuantity: 0,
			remainingQuantity: quantity,
		};
	}

	await deductUserResource(user_id, resource, quantity);
	const { remaining, totalEarnings } = await matchSellOrders(
		-user_id,
		resource,
		quantity,
		unitPrice,
	);

	if (totalEarnings > 0) await addUserCash(user_id, totalEarnings);

	let restingOfferId: number | undefined;
	if (remaining > 0) {
		restingOfferId = await getNextOfferId();
		await insertOffer(
			restingOfferId,
			-user_id,
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
