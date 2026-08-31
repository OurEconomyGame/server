import { getCompanyById } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

/**
 * Checks whether the user associated with the session token is the CEO of the specified company.
 *
 * @param auth_token - The user session token (or null).
 * @param company_id - The numeric company ID.
 * @returns A promise that resolves to true if the caller is the CEO, false otherwise.
 */
export async function isCompanyCeo(
	auth_token: string | null,
	company_id: number,
): Promise<boolean> {
	if (!auth_token || typeof auth_token !== "string" || !company_id) {
		return false;
	}

	const user = await getUserBySessionToken(auth_token);
	if (!user) {
		return false;
	}

	const company = await getCompanyById(company_id);
	if (!company) {
		return false;
	}

	return company.ceo === user.id || user.id === 0;
}

export default isCompanyCeo;
