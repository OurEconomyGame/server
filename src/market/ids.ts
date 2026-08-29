import { query } from "../db/init.ts";

/**
 * Retrieves the next sequential order ID from the database.
 *
 * @returns Next available order ID (defaults to 1).
 */
export async function getNextOrderId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *order{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}

/**
 * Retrieves the next sequential offer ID from the database.
 *
 * @returns Next available offer ID (defaults to 1).
 */
export async function getNextOfferId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *offer{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}
