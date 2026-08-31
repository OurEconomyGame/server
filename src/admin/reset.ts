import { getAllCompanies, getAllUsers } from "../db/gets.ts";
import { updateCompanyById, updateUserById } from "../db/updates.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

let serverResetEpoch = 0;

/**
 * Returns the current server reset epoch timestamp.
 */
export function getServerResetEpoch(): number {
	return serverResetEpoch;
}

/**
 * Sets the server-wide day reset epoch and schedules a progressive background cleanup over 10 minutes.
 */
export function triggerServerReset(): {
	epoch: number;
	window_minutes: number;
} {
	serverResetEpoch = Date.now();
	return { epoch: serverResetEpoch, window_minutes: 10 };
}

/**
 * Handles the admin endpoint to trigger a server-wide daily counter reset.
 */
export async function handleAdminResetDay(
	authToken: string | null,
): Promise<{
	status: string;
	epoch?: number;
	reset_in_next_minutes?: number;
	max_daily_jobs?: number;
}> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const user = await getUserBySessionToken(authToken);
	if (!user || user.id !== 0) {
		return { status: "Only the admin can reset daily counters" };
	}

	const resetInfo = triggerServerReset();

	return {
		status: "Success",
		epoch: resetInfo.epoch,
		reset_in_next_minutes: resetInfo.window_minutes,
		max_daily_jobs: 20,
	};
}

/**
 * Progressive background scrubber executed during server ticks to spread DB updates smoothly over 10 minutes.
 */
export async function scrubDailyCountersProgressive(): Promise<{
	scrubbed_companies: number;
	scrubbed_users: number;
}> {
	if (serverResetEpoch === 0)
		return { scrubbed_companies: 0, scrubbed_users: 0 };

	let scrubbedCompanies = 0;
	let scrubbedUsers = 0;

	// Process a batch of companies that haven't recorded the latest reset epoch
	try {
		const companies = await getAllCompanies();
		for (const company of companies.slice(0, 10)) {
			const cData = (company.data ?? {}) as Record<string, unknown>;
			if (
				typeof cData.last_reset_epoch !== "number" ||
				cData.last_reset_epoch < serverResetEpoch
			) {
				cData.daily_shifts_count = 0;
				cData.last_reset_epoch = serverResetEpoch;
				await updateCompanyById(company.id, { data: cData });
				scrubbedCompanies++;
			}
		}
	} catch (e) {
		console.error("[Reset] Error scrubbing companies:", e);
	}

	// Process a batch of users that haven't recorded the latest reset epoch
	try {
		const users = await getAllUsers();
		for (const u of users.slice(0, 10)) {
			const uData = (u.data ?? {}) as Record<string, unknown>;
			if (
				typeof uData.last_reset_epoch !== "number" ||
				uData.last_reset_epoch < serverResetEpoch
			) {
				uData.daily_works = {
					date: new Date().toISOString().slice(0, 10),
					count: 0,
					companies: [],
				};
				uData.last_reset_epoch = serverResetEpoch;
				await updateUserById(u.id, { data: uData });
				scrubbedUsers++;
			}
		}
	} catch (e) {
		console.error("[Reset] Error scrubbing users:", e);
	}

	return {
		scrubbed_companies: scrubbedCompanies,
		scrubbed_users: scrubbedUsers,
	};
}
