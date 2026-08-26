import { getCompanyById, getSharesByOwner } from "../db/gets.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface PortfolioHolding {
	share_id: number;
	company_id: number;
	company_name: string;
	company_type: number;
	quantity: number;
	shares_outstanding: number;
	ownership_percentage: number;
}

/**
 * Retrieves the authenticated user's portfolio of shares across all owned companies.
 *
 * @param auth_token - Session token required for user authentication.
 * @returns Object with status and array of portfolio holdings.
 */
export async function getUserPortfolio(
	auth_token: string | null,
): Promise<{ status: string; portfolio: PortfolioHolding[] }> {
	const token = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	if (!user) {
		return { status: "Unauthorized", portfolio: [] };
	}

	const userShares = await getSharesByOwner(user.id, true);
	const holdings: PortfolioHolding[] = [];

	for (const share of userShares) {
		const company = await getCompanyById(share.owned_id);
		const percentage =
			company && company.shares_outstanding > 0
				? Number(
						((share.quantity / company.shares_outstanding) * 100).toFixed(4),
					)
				: 0;

		holdings.push({
			share_id: share.id,
			company_id: share.owned_id,
			company_name: company ? company.name : "Unknown",
			company_type: company ? company.type : 0,
			quantity: share.quantity,
			shares_outstanding: company ? company.shares_outstanding : 0,
			ownership_percentage: percentage,
		});
	}

	// Sort holdings by quantity descending
	holdings.sort((a, b) => b.quantity - a.quantity);

	return { status: "Success", portfolio: holdings };
}
