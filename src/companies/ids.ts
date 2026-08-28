import { query } from "../db/init.ts";

/**
 * Retrieves the next sequential company ID from the database.
 *
 * @returns The next available numeric ID for a company (defaults to 1).
 */
export async function getNextCompanyId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *company{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}

/**
 * Retrieves the next sequential share ID from the database.
 *
 * @returns The next available numeric ID for a share record (defaults to 1).
 */
export async function getNextShareId(): Promise<number> {
	try {
		const result = await query<{ id: number }>(`?[id] := *shares{id}`);
		if (result.length === 0) return 1;
		const maxId = Math.max(...result.map((r) => r.id));
		return Number.isFinite(maxId) ? maxId + 1 : 1;
	} catch {
		return 1;
	}
}
