import { buyFromWebstore } from "./buy.ts";
import { executeNpcPurchase } from "./npc.ts";
import { setWebstorePrice } from "./price.ts";

export interface StorePayload {
	company_id?: number;
	company?: number;
	price?: number;
	food_price?: number;
	quantity?: number;
}

export async function handleStorePrice(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object")
		return { status: "Invalid request payload" };
	const p = payload as StorePayload;
	const compId = Number(p.company_id ?? p.company);
	const price = Number(p.price ?? p.food_price);
	return await setWebstorePrice(compId, price, authToken);
}

export async function handleStoreBuy(
	payload: unknown,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!payload || typeof payload !== "object")
		return { status: "Invalid request payload" };
	const p = payload as StorePayload;
	const compId = Number(p.company_id ?? p.company);
	const qty = Number(p.quantity);
	return await buyFromWebstore(compId, qty, authToken);
}

export async function handleStoreTick(): Promise<Record<string, unknown>> {
	return await executeNpcPurchase();
}
