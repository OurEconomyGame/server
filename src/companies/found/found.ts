import { getCompanyByName } from "../../db/gets.ts";
import { insertCompany, insertShare } from "../../db/inserts.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { getNextCompanyId, getNextShareId } from "../helpers/ids.ts";
import { respond } from "../helpers/response.ts";
import { validateFoundingParams } from "./validate.ts";

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

	// 2. Failure: Parameter format/field validation
	const validated = validateFoundingParams(params);
	if (!validated.ok) {
		return respond(validated.status, 0);
	}

	const { name, type, data } = validated;

	// 3. Failure: Company name already taken
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

	// 4. Failure: Database insert for company failed
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

	// 5. Failure: Database insert for initial shares failed
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

	// 6. Success: Company founded and shares granted
	return respond("OMG, this actually worked!?", companyId);
}

export { getNextCompanyId, getNextShareId };
