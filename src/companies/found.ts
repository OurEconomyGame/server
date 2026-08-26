import { getCompanyByName } from "../db/gets.ts";
import { query } from "../db/init.ts";
import { insertCompany, insertShare } from "../db/inserts.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

/**
 * Type helper that disallows empty strings (""), forcing a compile-time error
 * until a non-empty status message is provided.
 */
type NonEmptyString<T extends string> = "" extends T ? never : T;

/**
 * Constructs a standardized response object while enforcing non-blank status messages.
 */
function respond<S extends string>(
	status: NonEmptyString<S>,
	id = 0,
): { status: S; id: number } {
	if ((status as string) === "") {
		throw new Error("Status message cannot be blank");
	}
	return { status, id };
}

/**
 * Founds a new company and grants 100% of initial shares (10k default) to the creator.
 *
 * @param params - The company creation payload (name, type).
 * @param auth_token - Session token from request authorization header.
 * @returns An object with status and the created company ID.
 */
export async function foundCompany(
	params: unknown,
	auth_token: string | null,
): Promise<{ status: string; id: number }> {
	const token: string = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	// 1. Failure: Unauthorized (invalid/missing session token)
	if (!user) {
		return respond("Sorry, ghosts cant own companies", 0);
	}

	// 2. Failure: Invalid params root (not an object)
	if (!params || typeof params !== "object" || Array.isArray(params)) {
		return respond(
			"I need some info, you cant just say: I will start a buisness, and ask for a building, and then wonder why you got a bakery instead of a office building.",
			0,
		);
	}

	const p = params as Record<string, unknown>;

	// 3. Failure: Missing or invalid company name parameter type
	if (typeof p.name !== "string") {
		return respond(
			"Ok, um, are you thick? You didnt give me the info where I can see it.",
			0,
		);
	}

	const rawName = p.name;

	// 4. Failure: Empty or whitespace-only company name
	if (rawName.trim() === "") {
		return respond(
			"You cant have a null company, though I dont see why not zero width characters but it cant just be whitespace.",
			0,
		);
	}
	const name = rawName.trim();

	// 5. Failure: Missing or invalid company classification type parameter
	if (typeof p.the_hell_you_want !== "number" && typeof p.type !== "number") {
		return respond("I still aint got any idea what you want.", 0);
	}
	const type =
		typeof p.the_hell_you_want === "number"
			? p.the_hell_you_want
			: (p.type as number);

	const data: Record<string, unknown> = {};

	// 6. Failure: Company name already taken
	const existing = await getCompanyByName(name);
	if (existing !== null) {
		return respond(
			"Sorry, maybe add some zero width characters, if you want to commit fraud, be smart about it.",
			0,
		);
	}

	const founder_id = user.id;
	const ceo = user.id;
	const shares_outstanding = 10000;
	const now = Math.floor(Date.now() / 1000);
	const created_at = now;
	const last_accessed = now;

	const companyId = await getNextCompanyId();
	const shareId = await getNextShareId();

	// 7. Failure: Database insert for company failed
	const companySuccess = await insertCompany(
		companyId,
		name,
		founder_id,
		type,
		last_accessed,
		created_at,
		ceo,
		data,
		shares_outstanding,
	);

	if (!companySuccess) {
		return respond(
			"The server is broken, the db is broken. YOU ARE BROKEN!",
			0,
		);
	}

	// 8. Failure: Database insert for initial shares failed
	const shareSuccess = await insertShare(
		shareId,
		founder_id,
		true,
		shares_outstanding,
		companyId,
	);

	if (!shareSuccess) {
		return respond(
			"Your shares surprisingly dont exist and so the company is owned by the void.",
			companyId,
		);
	}

	// 9. Success: Company founded and shares granted
	return respond("OMG, this actually worked!?", companyId);
}

/**
 * Retrieves the next sequential company ID from the database.
 *
 * @returns The next available numeric ID for a company.
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
 * @returns The next available numeric ID for a share record.
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
