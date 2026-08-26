import { getAllCompanies } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface CompanyPublicInfo {
	id: number;
	name: string;
	founder_id: number;
	type: number;
	last_accessed: number;
	created_at: number;
	ceo: number;
	shares_outstanding: number;
	data?: Record<string, unknown>;
}

/**
 * Retrieves a list of companies.
 * All core fields are public, but the internal `data` payload is only included
 * if the request is authenticated by the company's CEO.
 *
 * @param params - Optional query parameters for sorting and filtering.
 * @param auth_token - Optional session token to determine CEO data visibility.
 * @returns Array of company information objects.
 */
export async function getAllCompaniesInfo(
	params?: Record<string, string> | null,
	auth_token?: string | null,
): Promise<CompanyPublicInfo[]> {
	const user = auth_token ? await getUserBySessionToken(auth_token) : null;
	const companies = await getAllCompanies();

	let filtered = companies;

	if (params?.type !== undefined) {
		const typeNum = Number(params.type);
		if (!Number.isNaN(typeNum)) {
			filtered = filtered.filter((c) => c.type === typeNum);
		}
	}

	if (params?.founder_id !== undefined) {
		const founderNum = Number(params.founder_id);
		if (!Number.isNaN(founderNum)) {
			filtered = filtered.filter((c) => c.founder_id === founderNum);
		}
	}

	if (params?.ceo !== undefined) {
		const ceoNum = Number(params.ceo);
		if (!Number.isNaN(ceoNum)) {
			filtered = filtered.filter((c) => c.ceo === ceoNum);
		}
	}

	const result: CompanyPublicInfo[] = filtered.map((c) => {
		const info: CompanyPublicInfo = {
			id: c.id,
			name: c.name,
			founder_id: c.founder_id,
			type: c.type,
			last_accessed: c.last_accessed,
			created_at: c.created_at,
			ceo: c.ceo,
			shares_outstanding: c.shares_outstanding,
		};

		// Only include private `data` if authenticated user is the CEO
		if (user && user.id === c.ceo) {
			info.data = c.data;
		}

		return info;
	});

	const sortBy = params?.sortBy;
	switch (sortBy) {
		case "name":
			result.sort((a, b) => a.name.localeCompare(b.name));
			break;
		case "created_at":
			result.sort((a, b) => a.created_at - b.created_at);
			break;
		default:
			result.sort((a, b) => a.id - b.id);
			break;
	}

	return result;
}
