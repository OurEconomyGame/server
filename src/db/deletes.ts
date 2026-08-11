import { query } from "./init.ts";
import { getUserById } from "./gets.ts";

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
