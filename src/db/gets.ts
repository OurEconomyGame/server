import { query } from "./init.ts";

export interface UserRecord {
	id: number;
	name: string;
	pass_hash: string;
	email: string;
	last_accessed: number;
	cash: number;
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
	cash: number;
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

export interface OrderRecord {
	id: number;
	company_id: number;
	resource: number;
	quantity: number;
	unitPrice: number;
}

export interface OfferRecord {
	id: number;
	company_id: number;
	resource: number;
	quantity: number;
	unitPrice: number;
}

export interface MessageRecord {
	id: number;
	sender_id: number;
	receiver_id: number;
	content: string;
	subject: string;
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
			?[id, name, pass_hash, email, last_accessed, cash, data, created_at] := *user{id, name, pass_hash, email, last_accessed, cash, data, created_at}, id == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	} else {
		const result = await query<UserRecord>(
			`
			?[id, name, pass_hash, email, last_accessed, cash, data, created_at] := *user{id, name, pass_hash, email, last_accessed, cash, data, created_at}, name == $identifier
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
export async function getUserByName(name: string): Promise<UserRecord | null> {
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
		?[id, name, pass_hash, email, last_accessed, cash, data, created_at] := *user{id, name, pass_hash, email, last_accessed, cash, data, created_at}
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
			?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding}, id == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	} else {
		const result = await query<CompanyRecord>(
			`
			?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding}, name == $identifier
			`,
			{ identifier },
		);
		return result.length > 0 && result[0] ? result[0] : null;
	}
}

/**
 * Helper to retrieve a company record by company ID.
 */
export async function getCompanyById(
	id: number,
): Promise<CompanyRecord | null> {
	return getCompany(id);
}

/**
 * Helper to retrieve a company record by company name.
 */
export async function getCompanyByName(
	name: string,
): Promise<CompanyRecord | null> {
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
		?[id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding] := *company{id, name, founder_id, type, last_accessed, cash, created_at, ceo, data, shares_outstanding}
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
 * Retrieves all share records owned by a specific user or company.
 *
 * @param owner_id - Numeric owner ID.
 * @param owner_user - Boolean flag: true if owner is a user, false if company.
 * @returns A promise resolving to an array of matching ShareRecords.
 */
export async function getSharesByOwner(
	owner_id: number,
	owner_user: boolean,
): Promise<ShareRecord[]> {
	return query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owner_id == $owner_id, owner_user == $owner_user
		`,
		{ owner_id, owner_user },
	);
}

/**
 * Retrieves all share records issued by a specific company (owned_id).
 *
 * @param owned_id - The numeric company ID whose shares are queried.
 * @returns A promise resolving to an array of matching ShareRecords.
 */
export async function getSharesByOwned(
	owned_id: number,
): Promise<ShareRecord[]> {
	return query<ShareRecord>(
		`
		?[id, owner_id, owner_user, quantity, owned_id] := *shares{id, owner_id, owner_user, quantity, owned_id}, owned_id == $owned_id
		`,
		{ owned_id },
	);
}

/**
 * Retrieves all share records in the database.
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
 * Retrieves an order record by order ID.
 *
 * @param id - The numeric order ID.
 * @returns A promise that resolves to the OrderRecord or null if not found.
 */
export async function getOrderById(id: number): Promise<OrderRecord | null> {
	const result = await query<OrderRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *order{id, company_id, resource, quantity, unitPrice}, id == $id
		`,
		{ id },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}

/**
 * Retrieves an offer record by offer ID.
 *
 * @param id - The numeric offer ID.
 * @returns A promise that resolves to the OfferRecord or null if not found.
 */
export async function getOfferById(id: number): Promise<OfferRecord | null> {
	const result = await query<OfferRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *offer{id, company_id, resource, quantity, unitPrice}, id == $id
		`,
		{ id },
	);
	return result.length > 0 && result[0] ? result[0] : null;
}

/**
 * Retrieves all order records in the database.
 *
 * @returns A promise that resolves to an array of all OrderRecords.
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
	return query<OrderRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *order{id, company_id, resource, quantity, unitPrice}
		`,
	);
}

/**
 * Retrieves all offer records in the database.
 *
 * @returns A promise that resolves to an array of all OfferRecords.
 */
export async function getAllOffers(): Promise<OfferRecord[]> {
	return query<OfferRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *offer{id, company_id, resource, quantity, unitPrice}
		`,
	);
}

/**
 * Retrieves all buy orders for a given resource, sorted from highest price to lowest price.
 *
 * @param resource - The resource enum ID.
 * @returns A promise resolving to an array of OrderRecords sorted descending by unitPrice.
 */
export async function getAllOrdersByResource(
	resource: number,
): Promise<OrderRecord[]> {
	const orders = await query<OrderRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *order{id, company_id, resource, quantity, unitPrice}, resource == $resource
		`,
		{ resource },
	);
	return orders.sort((a, b) => b.unitPrice - a.unitPrice);
}

/**
 * Retrieves all sell offers for a given resource, sorted from lowest price to highest price.
 *
 * @param resource - The resource enum ID.
 * @returns A promise resolving to an array of OfferRecords sorted ascending by unitPrice.
 */
export async function getAllOffersByResource(
	resource: number,
): Promise<OfferRecord[]> {
	const offers = await query<OfferRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *offer{id, company_id, resource, quantity, unitPrice}, resource == $resource
		`,
		{ resource },
	);
	return offers.sort((a, b) => a.unitPrice - b.unitPrice);
}

/**
 * Retrieves all buy orders placed by a specific company.
 *
 * @param company_id - The numeric company ID.
 * @returns A promise resolving to an array of matching OrderRecords.
 */
export async function getAllOrdersByCompany(
	company_id: number,
): Promise<OrderRecord[]> {
	return query<OrderRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *order{id, company_id, resource, quantity, unitPrice}, company_id == $company_id
		`,
		{ company_id },
	);
}

/**
 * Retrieves all sell offers placed by a specific company.
 *
 * @param company_id - The numeric company ID.
 * @returns A promise resolving to an array of matching OfferRecords.
 */
export async function getAllOffersByCompany(
	company_id: number,
): Promise<OfferRecord[]> {
	return query<OfferRecord>(
		`
		?[id, company_id, resource, quantity, unitPrice] := *offer{id, company_id, resource, quantity, unitPrice}, company_id == $company_id
		`,
		{ company_id },
	);
}

/**
 * Retrieves a single message by ID.
 *
 * @param id - The numeric message ID.
 * @returns A promise resolving to the MessageRecord if found, null otherwise.
 */
export async function getMessageById(id: number): Promise<MessageRecord | null> {
	const messages = await query<MessageRecord>(
		`
		?[id, sender_id, receiver_id, content, subject] := *message{id, sender_id, receiver_id, content, subject}, id == $id
		`,
		{ id },
	);
	return messages.length > 0 ? (messages[0] ?? null) : null;
}

/**
 * Retrieves all messages directed to a specific receiver ID.
 *
 * @param receiver_id - The recipient user ID.
 * @returns A promise resolving to an array of matching MessageRecords.
 */
export async function getMessagesByReceiver(
	receiver_id: number,
): Promise<MessageRecord[]> {
	return query<MessageRecord>(
		`
		?[id, sender_id, receiver_id, content, subject] := *message{id, sender_id, receiver_id, content, subject}, receiver_id == $receiver_id
		`,
		{ receiver_id },
	);
}

/**
 * Retrieves all messages sent by a specific sender ID.
 *
 * @param sender_id - The sender user ID.
 * @returns A promise resolving to an array of matching MessageRecords.
 */
export async function getMessagesBySender(
	sender_id: number,
): Promise<MessageRecord[]> {
	return query<MessageRecord>(
		`
		?[id, sender_id, receiver_id, content, subject] := *message{id, sender_id, receiver_id, content, subject}, sender_id == $sender_id
		`,
		{ sender_id },
	);
}

/**
 * Retrieves all messages in the database.
 *
 * @returns A promise resolving to an array of all MessageRecords.
 */
export async function getAllMessages(): Promise<MessageRecord[]> {
	return query<MessageRecord>(
		`
		?[id, sender_id, receiver_id, content, subject] := *message{id, sender_id, receiver_id, content, subject}
		`,
	);
}
