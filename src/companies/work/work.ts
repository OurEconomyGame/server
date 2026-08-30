import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById, updateUserById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { executeRandomProduction } from "./produce.ts";
import { assignWorkerSlot } from "./slots.ts";
import {
	type CompanyWorkData,
	getTodayUtc,
	type UserDailyWork,
	type WorkResult,
} from "./types.ts";

/**
 * Performs a work shift for a player at a company.
 */
export async function performWork(
	companyId: number,
	authToken: string | null,
): Promise<WorkResult> {
	if (!authToken) return { status: "Authentication token required" };
	if (!Number.isFinite(companyId) || companyId <= 0)
		return { status: "Invalid company_id" };

	const user = await getUserBySessionToken(authToken);
	if (!user) return { status: "Invalid session token" };

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };

	const today = getTodayUtc();
	const uData = (user.data ?? {}) as { daily_works?: UserDailyWork };
	if (uData.daily_works?.date !== today) {
		uData.daily_works = { date: today, count: 0, companies: [] };
	}
	if (uData.daily_works.count >= 10) {
		return { status: "Player has reached daily work limit (10 companies/day)" };
	}

	const cData = (company.data ?? {}) as CompanyWorkData;
	cData.inventory = cData.inventory ?? {};
	const slot = assignWorkerSlot(cData, user.id, today);
	if (slot.error || slot.idx === undefined) {
		return { status: slot.error ?? "Failed to assign worker slot" };
	}

	const wage = typeof cData.wage === "number" ? cData.wage : 10;
	if (company.cash < wage) {
		return { status: `Company cannot afford to pay wage ($${wage})` };
	}

	const prod = executeRandomProduction(cData.facilities, cData.inventory);
	company.cash -= wage;
	cData.worked![slot.idx] = true;
	user.cash += wage;
	uData.daily_works.count += 1;
	uData.daily_works.companies.push(companyId);

	await updateCompanyById(companyId, { cash: company.cash, data: cData });
	await updateUserById(user.id, { cash: user.cash, data: uData });

	return {
		status: "Success",
		wage_paid: wage,
		company_cash: company.cash,
		user_cash: user.cash,
		production: prod,
	};
}
