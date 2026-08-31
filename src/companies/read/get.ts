import {
	type CompanyRecord,
	getCompanyById,
	getCompanyByName,
	getSharesByOwned,
	getSharesByOwner,
} from "../../db/gets.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import type { UserShareholding } from "../../users/get.ts";
import type { CompanyPublicInfo } from "./list.ts";
import type { ShareholderInfo } from "./shareholders.ts";

/**
 * Retrieves a single company's details by ID or Name.
 * Public fields are accessible to all callers; `data` is only attached if caller is the company CEO.
 * Includes both cap table (`shareholders`) and company portfolio (`shareholdings`).
 *
 * @param params - Query parameters containing `id`, `name`, or `company_id`.
 * @param auth_token - Optional session token to verify CEO privilege.
 * @returns Company information or error object.
 */
export async function getCompanyInfo(
	params?: Record<string, string> | null,
	auth_token?: string | null,
): Promise<{ status: string; company: CompanyPublicInfo | null }> {
	if (
		!params ||
		(params.id === undefined &&
			params.name === undefined &&
			params.company_id === undefined)
	) {
		return { status: "Missing search parameters", company: null };
	}

	let company: CompanyRecord | null = null;

	const idParam = params.id ?? params.company_id;
	if (idParam !== undefined) {
		const idNum = Number(idParam);
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

	// Cap table: who owns shares in this company
	const sharesOwned = await getSharesByOwned(company.id);
	const shareholders: ShareholderInfo[] = sharesOwned.map((s) => {
		const percentage =
			company && company.shares_outstanding > 0
				? Number(((s.quantity / company.shares_outstanding) * 100).toFixed(4))
				: 0;

		return {
			share_id: s.id,
			owner_id: s.owner_id,
			owner_user: s.owner_user,
			quantity: s.quantity,
			percentage,
		};
	});
	shareholders.sort((a, b) => b.quantity - a.quantity);

	// Portfolio: shares this company owns in other companies
	const companyShares = await getSharesByOwner(company.id, false);
	const shareholdings: UserShareholding[] = [];
	for (const share of companyShares) {
		const targetCompany = await getCompanyById(share.owned_id);
		const percentage =
			targetCompany && targetCompany.shares_outstanding > 0
				? Number(
						((share.quantity / targetCompany.shares_outstanding) * 100).toFixed(4),
					)
				: 0;

		shareholdings.push({
			share_id: share.id,
			company_id: share.owned_id,
			company_name: targetCompany ? targetCompany.name : "Unknown",
			company_type: targetCompany ? targetCompany.type : 0,
			quantity: share.quantity,
			shares_outstanding: targetCompany ? targetCompany.shares_outstanding : 0,
			ownership_percentage: percentage,
		});
	}
	const wage =
		typeof company.data?.wage === "number" &&
		Number.isFinite(company.data.wage)
			? (company.data.wage as number)
			: 10;

	const companyInfo: CompanyPublicInfo = {
		id: company.id,
		name: company.name,
		founder_id: company.founder_id,
		type: company.type,
		last_accessed: company.last_accessed,
		cash: company.cash,
		created_at: company.created_at,
		ceo: company.ceo,
		shares_outstanding: company.shares_outstanding,
		wage,
		shareholders,
		shareholdings,
	};

	if (user && user.id === company.ceo) {
		companyInfo.data = company.data;
	}

	return { status: "Success", company: companyInfo };
}
