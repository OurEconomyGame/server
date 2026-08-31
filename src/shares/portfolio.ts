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
 * Admin (UID 0) can specify ?user_id= to view any user's portfolio.
 *
 * @param auth_token - Session token required for user authentication.
 * @param params - Optional query parameters with target user_id for admin.
 * @returns Object with status and array of portfolio holdings.
 */
export async function getUserPortfolio(
	auth_token: string | null,
	params?: Record<string, string> | null,
): Promise<{
	status: string;
	user_id?: number;
	portfolio: PortfolioHolding[];
}> {
	const token = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	if (!user) {
		return { status: "Unauthorized", portfolio: [] };
	}

	let targetUserId = user.id;
	if (
		params?.user_id !== undefined ||
		params?.id !== undefined ||
		params?.user !== undefined
	) {
		const reqId = Number(params.user_id ?? params.id ?? params.user);
		if (Number.isFinite(reqId) && (user.id === 0 || user.id === reqId)) {
			targetUserId = reqId;
		}
	}

	const userShares = await getSharesByOwner(targetUserId, true);
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

	return { status: "Success", user_id: targetUserId, portfolio: holdings };
}
