import { getServerResetEpoch } from "../../admin/reset.ts";
import { getCompanyById, getUserById } from "../../db/gets.ts";
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
 * A player can work up to 20 times a day total across any companies.
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
	const resetEpoch = getServerResetEpoch();
	const uData = (user.data ?? {}) as {
		daily_works?: UserDailyWork;
		last_reset_epoch?: number;
	};

	const isUserReset =
		uData.daily_works?.date !== today ||
		(typeof uData.last_reset_epoch === "number" &&
			uData.last_reset_epoch < resetEpoch) ||
		(uData.last_reset_epoch === undefined && resetEpoch > 0);

	if (isUserReset) {
		uData.daily_works = { date: today, count: 0, companies: [] };
		uData.last_reset_epoch = resetEpoch;
	}
	if (user.id !== 0 && uData.daily_works.count >= 20) {
		return { status: "Player has reached daily work limit (20 works/day)" };
	}

	const cData = (company.data ?? {}) as CompanyWorkData & {
		last_reset_epoch?: number;
	};
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

	const isCompanyReset =
		cData.last_work_day !== today ||
		(typeof cData.last_reset_epoch === "number" &&
			cData.last_reset_epoch < resetEpoch) ||
		(cData.last_reset_epoch === undefined && resetEpoch > 0);

	if (isCompanyReset) {
		cData.last_work_day = today;
		cData.daily_shifts_count = 0;
		cData.last_reset_epoch = resetEpoch;
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

export interface UserWorkStatusResponse {
	status: string;
	user_id?: number;
	username?: string;
	works_used?: number;
	works_left?: number | string;
	works_max?: number | string;
	date?: string;
	companies_worked?: number[];
}

/**
 * Retrieves the daily work quota status for a player.
 * Admin (UID 0) can specify ?user_id= to check any user's daily work limits.
 *
 * @param authToken - Session token from request headers.
 * @param params - Optional query parameters with target user_id for admin.
 * @returns Work shift usage, remaining work shifts, and company IDs worked today.
 */
export async function getUserWorkStatus(
	authToken: string | null,
	params?: Record<string, string> | null,
): Promise<UserWorkStatusResponse> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const caller = await getUserBySessionToken(authToken);
	if (!caller) {
		return { status: "Invalid session token" };
	}

	let targetUser = caller;
	if (
		params?.user_id !== undefined ||
		params?.id !== undefined ||
		params?.user !== undefined
	) {
		const reqId = Number(params.user_id ?? params.id ?? params.user);
		if (Number.isFinite(reqId) && (caller.id === 0 || caller.id === reqId)) {
			const found = await getUserById(reqId);
			if (found) {
				targetUser = found;
			}
		}
	}

	const today = getTodayUtc();
	const resetEpoch = getServerResetEpoch();
	const uData = (targetUser.data ?? {}) as {
		daily_works?: UserDailyWork;
		last_reset_epoch?: number;
	};

	const isReset =
		uData.daily_works?.date !== today ||
		(typeof uData.last_reset_epoch === "number" &&
			uData.last_reset_epoch < resetEpoch) ||
		(uData.last_reset_epoch === undefined && resetEpoch > 0);

	const count = !isReset ? (uData.daily_works?.count ?? 0) : 0;
	const companies =
		!isReset && Array.isArray(uData.daily_works?.companies)
			? uData.daily_works!.companies
			: [];

	const isAdmin = targetUser.id === 0;

	return {
		status: "Success",
		user_id: targetUser.id,
		username: targetUser.name,
		works_used: count,
		works_left: isAdmin ? "unlimited" : Math.max(0, 20 - count),
		works_max: isAdmin ? "unlimited" : 20,
		date: today,
		companies_worked: companies,
	};
}

