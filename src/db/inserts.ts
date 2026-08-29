import { query } from "./init.ts";

/**
 * Inserts a new user record into the database.
 *
 * @param id - The unique user ID.
 * @param name - The user's name.
 * @param pass_hash - The hashed password of the user.
 * @param email - The user's email address.
 * @param last_accessed - Unix timestamp of the last access.
 * @param cash - Initial cash balance of the user.
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
	cash: number,
	data: Record<string, unknown>,
	created_at: number,
): Promise<boolean> {
	try {
		await query(
			`
			?[id, name, pass_hash, email, last_accessed, cash, data, created_at] <- [
				[$id, $name, $pass_hash, $email, $last_accessed, $cash, $data, $created_at]
			]
			:insert user { id => name, pass_hash, email, last_accessed, cash, data, created_at }
			`,
			{
				id,
				name,
				pass_hash,
				email,
				last_accessed,
				cash,
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

/**
 * Inserts a new session record into the database.
 *
 * @param id - The unique session ID.
 * @param created_at - Unix timestamp of session creation.
 * @param token - The unique session token string.
 * @param user_id - The user ID linked to this session.
 * @returns A promise that resolves to true if successful, or false if the insert failed.
 */
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
			:insert session { id => created_at, token, user_id }
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

/**
 * Inserts a new company record into the database.
 *
 * @param id - The unique company ID.
 * @param name - The company's name.
 * @param founder_id - User ID of the founder.
 * @param type - Numeric industry/company classification type.
 * @param last_accessed - Unix timestamp of last access.
 * @param cash - Initial cash balance of the company treasury.
 * @param created_at - Unix timestamp of company creation.
 * @param ceo - User ID of current CEO.
 * @param data - Extra metadata/state associated with the company.
 * @param shares_outstanding - Total outstanding shares authorized/issued.
 * @returns A promise that resolves to true if successful, or false if the insert failed.
 */
export async function insertCompany(
	id: number,
	name: string,
	founder_id: number,
	type: number,
	last_accessed: number,
	cash: number,
	created_at: number,
	ceo: number,
	data: Record<string, unknown>,
	shares_outstanding: number,
): Promise<boolean> {
	try {
		await query(
			`
			?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] <- [
				[$id, $name, $founder_id, $type, $last_accessed, $cash, $created_at, $ceo, $data, $shares_outstanding]
			]
			:insert company { id => name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding }
			`,
			{
				id,
				name,
				founder_id,
				type,
				last_accessed,
				cash,
				created_at,
				ceo,
				data,
				shares_outstanding,
			},
		);
		return true;
	} catch (error: unknown) {
		console.error("Failed to insert company:", error);
		return false;
	}
}

/**
 * Inserts a new share ownership record into the database.
 *
 * @param id - The unique share record ID.
 * @param owner_id - User ID or Company ID of the owner.
 * @param owner_user - True if owner is a user, false if owner is a company.
 * @param quantity - Number of shares held.
 * @param owned_id - Company ID whose shares are held.
 * @returns A promise that resolves to true if successful, or false if the insert failed.
 */
export async function insertShare(
	id: number,
	owner_id: number,
	owner_user: boolean,
	quantity: number,
	owned_id: number,
): Promise<boolean> {
	try {
		await query(
			`
			?[id, owner_id, owner_user, quantity, owned_id] <- [
				[$id, $owner_id, $owner_user, $quantity, $owned_id]
			]
			:insert shares { id => owner_id, owner_user, quantity, owned_id }
			`,
			{
				id,
				owner_id,
				owner_user,
				quantity,
				owned_id,
			},
		);
		return true;
	} catch (error: unknown) {
		console.error("Failed to insert share:", error);
		return false;
	}
}
