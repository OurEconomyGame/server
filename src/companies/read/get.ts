import {
	type CompanyRecord,
	getCompanyById,
	getCompanyByName,
} from "../../db/gets.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import type { CompanyPublicInfo } from "./list.ts";

/**
 * Retrieves a single company's details by ID or Name.
 * Public fields are accessible to all callers; `data` is only attached if caller is the company CEO.
 *
 * @param params - Query parameters containing `id` or `name`.
 * @param auth_token - Optional session token to verify CEO privilege.
 * @returns Company information or error object.
 */
export async function getCompanyInfo(
	params?: Record<string, string> | null,
	auth_token?: string | null,
): Promise<{ status: string; company: CompanyPublicInfo | null }> {
	if (!params) {
		return { status: "Missing search parameters", company: null };
	}

	let company: CompanyRecord | null = null;

	if (params.id !== undefined) {
		const idNum = Number(params.id);
		if (!Number.isNaN(idNum)) {
			company = await getCompanyById(idNum);
		}
	} else if (params.name !== undefined && typeof params.name === "string") {
		company = await getCompanyByName(params.name);
	}

	if (!company) {
		return { status: "Company not found", company: null };
	}

	const user = auth_token ? await getUserBySessionToken(auth_token) : null;

	const companyInfo: CompanyPublicInfo = {
		id: company.id,
		name: company.name,
		founder_id: company.founder_id,
		type: company.type,
		last_accessed: company.last_accessed,
		created_at: company.created_at,
		ceo: company.ceo,
		shares_outstanding: company.shares_outstanding,
	};

	if (user && user.id === company.ceo) {
		companyInfo.data = company.data;
	}

	return { status: "Success", company: companyInfo };
}
