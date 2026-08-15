import { query } from "./init.ts";
import {
	getUserById,
	getCompanyById,
	getShareById,
	type UserRecord,
	type SessionRecord,
	type CompanyRecord,
	type ShareRecord,
} from "./gets.ts";

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

/**
 * Updates a company record by company ID.
 *
 * @param id - The numeric company ID to update.
 * @param updates - Partial object containing updated fields.
 * @returns A promise that resolves to the updated CompanyRecord, or null if company not found.
 */
export async function updateCompanyById(
	id: number,
	updates: Partial<Omit<CompanyRecord, "id">>,
): Promise<CompanyRecord | null> {
	const existing = await getCompanyById(id);
	if (!existing) {
		return null;
	}

	const updated: CompanyRecord = {
		...existing,
		...updates,
		id,
	};

	try {
		await query(
			`
			?[id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding] <- [
				[$id, $name, $founder_id, $type, $last_accessed, $created_at, $ceo, $data, $shares_outstanding]
			]
			:put company { id => name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding }
			`,
			{
				id: updated.id,
				name: updated.name,
				founder_id: updated.founder_id,
				type: updated.type,
				last_accessed: updated.last_accessed,
				created_at: updated.created_at,
				ceo: updated.ceo,
				data: updated.data,
				shares_outstanding: updated.shares_outstanding,
			},
		);
		return updated;
	} catch (error: unknown) {
		console.error(`Failed to update company by ID ${id}:`, error);
		return null;
	}
}

/**
 * Updates a share record by share ID.
 *
 * @param id - The numeric share ID to update.
 * @param updates - Partial object containing updated fields.
 * @returns A promise that resolves to the updated ShareRecord, or null if share not found.
 */
export async function updateShareById(
	id: number,
	updates: Partial<Omit<ShareRecord, "id">>,
): Promise<ShareRecord | null> {
	const existing = await getShareById(id);
	if (!existing) {
		return null;
	}

	const updated: ShareRecord = {
		...existing,
		...updates,
		id,
	};

	try {
		await query(
			`
			?[id, owner_id, owner_user, quantity, owned_id] <- [
				[$id, $owner_id, $owner_user, $quantity, $owned_id]
			]
			:put shares { id => owner_id, owner_user, quantity, owned_id }
			`,
			{
				id: updated.id,
				owner_id: updated.owner_id,
				owner_user: updated.owner_user,
				quantity: updated.quantity,
				owned_id: updated.owned_id,
			},
		);
		return updated;
	} catch (error: unknown) {
		console.error(`Failed to update share by ID ${id}:`, error);
		return null;
	}
}
