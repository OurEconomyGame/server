import { getServerResetEpoch } from "../admin/reset.ts";
import { Resources } from "../companies/production/resources.ts";
import { getTodayUtc, type UserDailyWork } from "../companies/work/types.ts";
import { updateUserById } from "../db/updates.ts";
import { getUserBySessionToken } from "../sessions/check.ts";

export interface ConsumeFoodResult {
	status: string;
	food_consumed?: number;
	food_remaining?: number;
	works_used?: number;
	works_left?: number | string;
	works_max?: number | string;
	user_id?: number;
}

/**
 * Consumes 1 unit of food from player's personal inventory to reset their daily work shift counter.
 *
 * @param authToken - User session token.
 * @returns Result object with food consumption details and reset work shift status.
 */
export async function consumeFood(
	authToken: string | null,
): Promise<ConsumeFoodResult> {
	if (!authToken) {
		return { status: "Authentication token required" };
	}

	const user = await getUserBySessionToken(authToken);
	if (!user) {
		return { status: "Invalid session token" };
	}

	const uData = (user.data ?? {}) as {
		inventory?: Record<number | string, number>;
		daily_works?: UserDailyWork;
		last_reset_epoch?: number;
	};

	uData.inventory = uData.inventory ?? {};
	const currentFood = Number(
		uData.inventory[Resources.Food] ??
			uData.inventory[String(Resources.Food)] ??
			0,
	);

	if (currentFood < 1) {
		return {
			status: `Insufficient food. Available: ${currentFood}`,
		};
	}

	// Deduct 1 food unit
	const remainingFood = currentFood - 1;
	uData.inventory[Resources.Food] = remainingFood;

	// Reset daily works counter for today
	const today = getTodayUtc();
	const resetEpoch = getServerResetEpoch();
	uData.daily_works = { date: today, count: 0, companies: [] };
	uData.last_reset_epoch = resetEpoch;

	await updateUserById(user.id, { data: uData });

	const isAdmin = user.id === 0;

	return {
		status: "Success",
		user_id: user.id,
		food_consumed: 1,
		food_remaining: remainingFood,
		works_used: 0,
		works_left: isAdmin ? "unlimited" : 20,
		works_max: isAdmin ? "unlimited" : 20,
	};
}
