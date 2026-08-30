import {
	getCompanyById,
	getOfferById,
	getOrderById,
	getShareById,
	getUserById,
} from "./gets.ts";
import { query } from "./init.ts";

/**
 * Deletes a user record by user ID.
 *
 * @param id - The numeric user ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteUserById(id: number): Promise<boolean> {
	const existing = await getUserById(id);
	if (!existing) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm user { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete user by ID ${id}:`, error);
		return false;
	}
}

/**
 * Deletes a session record by session ID.
 *
 * @param id - The numeric session ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteSessionById(id: number): Promise<boolean> {
	const result = await query<{ id: number }>(
		`
		?[id] := *session{id}, id == $id
		`,
		{ id },
	);

	if (result.length === 0) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm session { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete session by ID ${id}:`, error);
		return false;
	}
}

/**
 * Deletes a company record by company ID.
 *
 * @param id - The numeric company ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteCompanyById(id: number): Promise<boolean> {
	const existing = await getCompanyById(id);
	if (!existing) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm company { id }
			`,
			{ id },
		);
		await query(
			`
			?[id] := *shares{id, owned_id}, owned_id == $id
			:rm shares { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete company by ID ${id}:`, error);
		return false;
	}
}

/**
 * Deletes a share record by share ID.
 *
 * @param id - The numeric share ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteShareById(id: number): Promise<boolean> {
	const existing = await getShareById(id);
	if (!existing) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm shares { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete share by ID ${id}:`, error);
		return false;
	}
}

/**
 * Deletes an order record by order ID.
 *
 * @param id - The numeric order ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteOrderById(id: number): Promise<boolean> {
	const existing = await getOrderById(id);
	if (!existing) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm order { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete order by ID ${id}:`, error);
		return false;
	}
}

/**
 * Deletes an offer record by offer ID.
 *
 * @param id - The numeric offer ID to delete.
 * @returns A promise that resolves to true if deleted, or false if not found or failed.
 */
export async function deleteOfferById(id: number): Promise<boolean> {
	const existing = await getOfferById(id);
	if (!existing) {
		return false;
	}

	try {
		await query(
			`
			?[id] <- [[$id]]
			:rm offer { id }
			`,
			{ id },
		);
		return true;
	} catch (error: unknown) {
		console.error(`Failed to delete offer by ID ${id}:`, error);
		return false;
	}
}
