import { query } from "./init.ts";

/**
 * Inserts a new user record into the database.
 *
 * @param id - The unique user ID.
 * @param name - The user's name.
 * @param pass_hash - The hashed password of the user.
 * @param email - The user's email address.
 * @param last_accessed - Unix timestamp of the last access.
 * @param data - Extra metadata associated with the user.
 * @param created_at - Unix timestamp of creation.
 * @returns A promise that resolves to true if successful, or false if the insert failed.
 */
export async function insertUser(
	id: number,
	name: string,
	pass_hash: string,
	email: string,
	last_accessed: number,
	data: Record<string, unknown>,
	created_at: number,
): Promise<boolean> {
	try {
		await query(
			`
			?[id, name, pass_hash, email, last_accessed, data, created_at] <- [
				[$id, $name, $pass_hash, $email, $last_accessed, $data, $created_at]
			]
			:insert user { id => name, pass_hash, email, last_accessed, data, created_at }
		`,
			{
				id,
				name,
				pass_hash,
				email,
				last_accessed,
				data,
				created_at,
			},
		);
		return true;
	} catch (error: unknown) {
		console.error("Failed to insert user:", error);
		return false;
	}
}

export async function insertSession(
	id: number,
	created_at: number,
	token: string,
	user_id: number,
): Promise<boolean> {
	try {
		await query(
			`
			?[id, created_at, token, user_id] <- [
				[$id, $created_at, $token, $user_id]
			]
			:insert session { id => created_at, token, user_id}
		`,
			{
				id,
				created_at,
				token,
				user_id,
			},
		);
		return true;
	} catch (error: unknown) {
		console.error("Failed to insert session:", error);
		return false;
	}
}
