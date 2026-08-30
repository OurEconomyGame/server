import {
	getCompanyById,
	getSharesByOwned,
	getUserById,
} from "../../db/gets.ts";
import { updateCompanyById, updateUserById } from "../../db/updates.ts";
import { isCompanyCeo } from "../auth.ts";

/**
 * Distributes company cash pro-rata to all shareholders (CEO only).
 */
export async function distributeCompanyDividend(
	companyId: number,
	amount: number,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Invalid company_id" };
	}
	if (!Number.isFinite(amount) || amount <= 0) {
		return { status: "Dividend amount must be greater than 0" };
	}

	const isCeo = await isCompanyCeo(authToken, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can distribute company dividends" };
	}

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };

	if (company.cash < amount) {
		return {
			status: `Insufficient company cash. Available: $${company.cash}, required: $${amount}`,
		};
	}

	const shares = await getSharesByOwned(companyId);
	if (shares.length === 0) {
		return { status: "No shareholders found for this company" };
	}

	const totalShares =
		shares.reduce((sum, s) => sum + s.quantity, 0) ||
		company.shares_outstanding;
	if (totalShares <= 0)
		return { status: "Total shares must be greater than 0" };

	for (const s of shares) {
		const payout = (s.quantity / totalShares) * amount;
		if (s.owner_user) {
			const u = await getUserById(s.owner_id);
			if (u) await updateUserById(u.id, { cash: u.cash + payout });
		} else {
			const c = await getCompanyById(s.owner_id);
			if (c) await updateCompanyById(c.id, { cash: c.cash + payout });
		}
	}

	company.cash -= amount;
	await updateCompanyById(company.id, { cash: company.cash });

	return {
		status: "Success",
		dividend_distributed: amount,
		remaining_cash: company.cash,
		shareholders_paid: shares.length,
	};
}
