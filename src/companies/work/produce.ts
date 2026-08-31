import type { IFacility } from "../production/facilities.ts";
import type { ProductionCycleResult } from "./types.ts";

/**
 * Triggers a production cycle on company facilities in descending order.
 */
export function executeProduction(
	facilities: IFacility[] | undefined,
	inventory: Record<number, number>,
	workerIdx?: number,
): ProductionCycleResult {
	if (!facilities || facilities.length === 0) {
		return { error: "No facilities available to produce" };
	}

	const active = facilities.filter((f) => f.active !== false);
	if (active.length === 0) {
		return { error: "All facilities are currently inactive" };
	}

	// Process facilities in descending order (highest index down to 0)
	const idx = typeof workerIdx === "number" && workerIdx >= 0 ? workerIdx : 0;
	const targetIndex = active.length - 1 - (idx % active.length);
	const fac = active[targetIndex]!;
	const inputs = fac.recipe?.inputs ?? {};

	for (const [resKey, reqQty] of Object.entries(inputs)) {
		const resId = Number(resKey);
		const required = Number(reqQty ?? 0);
		if (required > 0 && (inventory[resId] ?? 0) < required) {
			return {
				facility: fac.name,
				error: `Insufficient input resource (${resId}) for production cycle`,
			};
		}
	}

	for (const [resKey, reqQty] of Object.entries(inputs)) {
		const resId = Number(resKey);
		const required = Number(reqQty ?? 0);
		if (required > 0) {
			inventory[resId] = (inventory[resId] ?? 0) - required;
		}
	}

	const outType = fac.recipe.outputType;
	const level = Math.max(1, fac.level ?? 1);
	const outQty = (fac.recipe.outputQuant ?? 1) * level;
	inventory[outType] = (inventory[outType] ?? 0) + outQty;
	fac.last_used_day = Math.floor(Date.now() / 86400000);

	return { facility: fac.name, output: outType, quantity: outQty };
}

/**
 * Backwards compatibility alias for executeProduction.
 */
export const executeRandomProduction = executeProduction;

