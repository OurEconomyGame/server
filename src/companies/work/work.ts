import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById, updateUserById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { executeProduction } from "./produce.ts";
import {
	type CompanyWorkData,
	getTodayUtc,
	type UserDailyWork,
	type WorkResult,
} from "./types.ts";

/**
 * Performs a work shift for a player at a company.
 * A player can work up to 10 times a day total across any companies.
 * A company can support as many work shifts per day as it has active facilities.
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
		return { status: "Player has reached daily work limit (10 works/day)" };
	}

	const cData = (company.data ?? {}) as CompanyWorkData;
	cData.inventory = cData.inventory ?? {};
	const facilities = Array.isArray(cData.facilities) ? cData.facilities : [];
	const activeFacilities = facilities.filter((f) => f.active !== false);

	if (activeFacilities.length === 0) {
		return {
			status: "The Company is being IFFFY today",
			error:
				facilities.length === 0
					? "No facilities available to produce"
					: "All facilities are currently inactive",
		};
	}

	if (cData.last_work_day !== today) {
		cData.last_work_day = today;
		cData.daily_shifts_count = 0;
	} else {
		cData.daily_shifts_count =
			typeof cData.daily_shifts_count === "number"
				? cData.daily_shifts_count
				: 0;
	}

	if (cData.daily_shifts_count >= activeFacilities.length) {
		return {
			status: `Company has reached maximum daily work capacity for its facilities (${activeFacilities.length}/${activeFacilities.length} shifts used today)`,
		};
	}

	const wage = typeof cData.wage === "number" ? cData.wage : 10;
	if (company.cash < wage) {
		return { status: `Company cannot afford to pay wage ($${wage})` };
	}

	const shiftIdx = cData.daily_shifts_count;
	const prod = executeProduction(cData.facilities, cData.inventory, shiftIdx);
	if (prod.error) {
		return { status: "The Company is being IFFFY today", error: prod.error };
	}

	company.cash -= wage;
	cData.daily_shifts_count += 1;
	user.cash += wage;
	uData.daily_works.count += 1;
	if (!Array.isArray(uData.daily_works.companies)) {
		uData.daily_works.companies = [];
	}
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
