import {
	type CompanyRecord,
	getCompanyById,
	getCompanyByName,
	getSharesByOwned,
} from "../../db/gets.ts";

export interface ShareholderInfo {
	share_id: number;
	owner_id: number;
	owner_user: boolean;
	quantity: number;
	percentage: number;
}

/**
 * Retrieves the public cap table / shareholder list for a given company.
 *
 * @param params - Query parameters containing `id` or `name`.
 * @returns Object with status, company ID, total shares, and shareholders list.
 */
export async function getCompanyShareholders(
	params?: Record<string, string> | null,
): Promise<{
	status: string;
	company_id: number;
	shares_outstanding: number;
	shareholders: ShareholderInfo[];
}> {
	if (!params) {
		return {
			status: "Missing search parameters",
			company_id: 0,
			shares_outstanding: 0,
			shareholders: [],
		};
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
		return {
			status: "Company not found",
			company_id: 0,
			shares_outstanding: 0,
			shareholders: [],
		};
	}

	const shares = await getSharesByOwned(company.id);

	const shareholders: ShareholderInfo[] = shares.map((s) => {
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

	// Sort by quantity descending
	shareholders.sort((a, b) => b.quantity - a.quantity);

	return {
		status: "Success",
		company_id: company.id,
		shares_outstanding: company.shares_outstanding,
		shareholders,
	};
}
