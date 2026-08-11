import { query } from "./init.ts";
import { getUserById, type UserRecord, type SessionRecord } from "./gets.ts";

/**
 * Updates a user record by user ID.
 *
 * @param id - The numeric user ID to update.
 * @param updates - Partial object containing updated fields.
 * @returns A promise that resolves to the updated UserRecord, or null if user not found.
 */
export async function updateUserById(
	id: number,
	updates: Partial<Omit<UserRecord, "id">>,
): Promise<UserRecord | null> {
	const existing = await getUserById(id);
	if (!existing) {
		return null;
	}

	const updated: UserRecord = {
		...existing,
		...updates,
		id,
	};

	try {
		await query(
			`
			?[id, name, pass_hash, email, last_accessed, data, created_at] <- [
				[$id, $name, $pass_hash, $email, $last_accessed, $data, $created_at]
			]
			:put user { id => name, pass_hash, email, last_accessed, data, created_at }
			`,
			{
				id: updated.id,
				name: updated.name,
				pass_hash: updated.pass_hash,
				email: updated.email,
				last_accessed: updated.last_accessed,
				data: updated.data,
				created_at: updated.created_at,
			},
		);
		return updated;
	} catch (error: unknown) {
		console.error(`Failed to update user by ID ${id}:`, error);
		return null;
	}
}

/**
 * Updates a session record by session ID.
 *
 * @param id - The numeric session ID to update.
 * @param updates - Partial object containing updated fields.
 * @returns A promise that resolves to the updated SessionRecord, or null if session not found.
 */
export async function updateSessionById(
	id: number,
	updates: Partial<Omit<SessionRecord, "id">>,
): Promise<SessionRecord | null> {
	const result = await query<SessionRecord>(
		`
		?[id, user_id, created_at, token] := *session{id, user_id, created_at, token}, id == $id
		`,
		{ id },
	);

	if (result.length === 0 || !result[0]) {
		return null;
	}

	const existing = result[0];
	const updated: SessionRecord = {
		...existing,
		...updates,
		id,
	};

	try {
		await query(
			`
			?[id, user_id, created_at, token] <- [
				[$id, $user_id, $created_at, $token]
			]
			:put session { id => user_id, created_at, token }
			`,
			{
				id: updated.id,
				user_id: updated.user_id,
				created_at: updated.created_at,
				token: updated.token,
			},
		);
		return updated;
	} catch (error: unknown) {
		console.error(`Failed to update session by ID ${id}:`, error);
		return null;
	}
}
