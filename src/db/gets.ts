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

export interface CompanyRecord {
	id: number;
	name: string;
	founder_id: number;
	type: number;
	last_accessed: number;
	created_at: number;
	ceo: number;
	data: Record<string, unknown>;
	shares_outstanding: number;
}

export interface ShareRecord {
	id: number;
	owner_id: number;
	owner_user: boolean;
	quantity: number;
	owned_id: number;
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
 */
export async function getUser(id: number): Promise<UserRecord | null>;
/**
 * Retrieves a user record by username (name).
 *
 * @param name - The username string.
 */
export async function getUser(name: string): Promise<UserRecord | null>;
/**
 * Retrieves a user record by either user ID or username.
 *
 * @param identifier - Numeric user ID or username string.
 * @returns A promise that resolves to the UserRecord or null if not found.
 */
export async function getUser(
	identifier: number | string,
): Promise<UserRecord | null> {
	if (typeof identifier === "number") {
		const result = await query<UserRecord>(
			`
			?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}, id == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	} else {
		const result = await query<UserRecord>(
			`
			?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}, name == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	}
}

/**
 * Helper to retrieve a user record by user ID.
 */
export async function getUserById(id: number): Promise<UserRecord | null> {
	return getUser(id);
}

/**
 * Helper to retrieve a user record by username.
 */
export async function getUserByName(
	name: string,
): Promise<UserRecord | null> {
	return getUser(name);
}

/**
 * Retrieves all user records.
 *
 * @returns A promise that resolves to an array of all UserRecords.
 */
export async function getAllUsers(): Promise<UserRecord[]> {
	return query<UserRecord>(
		`
		?[id, name, pass_hash, email, last_accessed, data, created_at] := *user{id, name, pass_hash, email, last_accessed, data, created_at}
		`,
	);
}

/**
 * Retrieves all session records.
 *
 * @returns A promise that resolves to an array of all SessionRecords.
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
	return query<SessionRecord>(
		`
		?[id, user_id, created_at, token] := *session{id, user_id, created_at, token}
		`,
	);
}

/**
 * Retrieves a company record by company ID.
 *
 * @param id - The numeric company ID.
 */
export async function getCompany(id: number): Promise<CompanyRecord | null>;
/**
 * Retrieves a company record by company name.
 *
 * @param name - The company name string.
 */
export async function getCompany(name: string): Promise<CompanyRecord | null>;
/**
 * Retrieves a company record by either company ID or company name.
 *
 * @param identifier - Numeric company ID or company name string.
 * @returns A promise that resolves to the CompanyRecord or null if not found.
 */
export async function getCompany(
	identifier: number | string,
): Promise<CompanyRecord | null> {
	if (typeof identifier === "number") {
		const result = await query<CompanyRecord>(
			`
			?[id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding}, id == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	} else {
		const result = await query<CompanyRecord>(
			`
			?[id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding}, name == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	}
}

/**
 * Helper to retrieve a company record by company ID.
 */
export async function getCompanyById(id: number): Promise<CompanyRecord | null> {
	return getCompany(id);
}

/**
 * Helper to retrieve a company record by company name.
 */
export async function getCompanyByName(name: string): Promise<CompanyRecord | null> {
	return getCompany(name);
}

/**
 * Retrieves all company records.
 *
 * @returns A promise that resolves to an array of all CompanyRecords.
 */
export async function getAllCompanies(): Promise<CompanyRecord[]> {
	return query<CompanyRecord>(
		`
		?[id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, created_at, ceo, data, shares_outstanding}
		`,
	);
}

/**
 * Retrieves a share record by share ID.
 *
 * @param id - The numeric share ID.
 * @returns A promise that resolves to the ShareRecord or null if not found.
 */
export async function getShareById(id: number): Promise<ShareRecord | null> {
	const result = await query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, id == $id
		`,
		{ id },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}

/**
 * Retrieves all share records.
 *
 * @returns A promise that resolves to an array of all ShareRecords.
 */
export async function getAllShares(): Promise<ShareRecord[]> {
	return query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}
		`,
	);
}

/**
 * Retrieves share records owned by a specific owner (user or company).
 *
 * @param owner_id - The numeric ID of the owner entity.
 * @param owner_user - Optional boolean to filter by owner type (true for user, false for company).
 * @returns A promise that resolves to an array of matching ShareRecords.
 */
export async function getSharesByOwner(
	owner_id: number,
	owner_user?: boolean,
): Promise<ShareRecord[]> {
	if (typeof owner_user === "boolean") {
		return query<ShareRecord>(
			`
			?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owner_id == $owner_id, owner_user == $owner_user
			`,
			{ owner_id, owner_user },
		);
	}
	return query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owner_id == $owner_id
		`,
		{ owner_id },
	);
}

/**
 * Retrieves share records for a specific owned company.
 *
 * @param owned_id - The numeric ID of the company whose shares are owned.
 * @returns A promise that resolves to an array of matching ShareRecords.
 */
export async function getSharesByOwned(owned_id: number): Promise<ShareRecord[]> {
	return query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owned_id == $owned_id
		`,
		{ owned_id },
	);
}
