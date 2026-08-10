import { query } from "./init.ts";

export interface UserRecord {
	id: number;
	name: string;
	pass_hash: string;
	email: string;
	last_accessed: number;
	data: Record<string, unknown>;
	created_at: number;
}

export interface SessionRecord {
	id: number;
	user_id: number;
	created_at: number;
	token: string;
}

/**
 * Retrieves a session record by token.
 *
 * @param token - The token string of the session.
 * @returns A promise that resolves to the SessionRecord or null if not found.
 */
export async function getSessionByToken(
	token: string,
): Promise<SessionRecord | null> {
	const result = await query<SessionRecord>(
		`
		?[id, user_id, created_at, token] := *session{id, user_id, created_at, token}, token == $token
		`,
		{ token },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}

/**
 * Retrieves a user record by user ID.
 *
 * @param id - The numeric user ID.
 * @returns A promise that resolves to the UserRecord or null if not found.
 */
export async function getUserById(id: number): Promise<UserRecord | null> {
	const result = await query<UserRecord>(
		`
		?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}, id == $id
		`,
		{ id },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}

/**
 * Retrieves a user record by username (name).
 *
 * @param name - The username string.
 * @returns A promise that resolves to the UserRecord or null if not found.
 */
export async function getUserByName(
	name: string,
): Promise<UserRecord | null> {
	const result = await query<UserRecord>(
		`
		?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}, name == $name
		`,
		{ name },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}
