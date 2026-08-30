import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById, updateUserById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";

/**
 * Deposits personal player cash into a company's treasury.
 */
export async function depositCompanyCash(
	companyId: number,
	amount: number,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!authToken) return { status: "Authentication token required" };
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Invalid company_id" };
	}
	if (!Number.isFinite(amount) || amount <= 0) {
		return { status: "Deposit amount must be greater than 0" };
	}

	const user = await getUserBySessionToken(authToken);
	if (!user) return { status: "Invalid session token" };

	if (user.cash < amount) {
		return {
			status: `Insufficient personal funds. Available: $${user.cash}, required: $${amount}`,
		};
	}

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };

	user.cash -= amount;
	company.cash += amount;

	await updateUserById(user.id, { cash: user.cash });
	await updateCompanyById(company.id, { cash: company.cash });

	return {
		status: "Success",
		deposited: amount,
		user_cash: user.cash,
		company_cash: company.cash,
	};
}
