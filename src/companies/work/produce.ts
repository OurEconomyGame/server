import type { IFacility } from "../production/facilities.ts";
import type { ProductionCycleResult } from "./types.ts";

/**
 * Triggers a production cycle on a randomly selected active company facility.
 */
export function executeRandomProduction(
	facilities: IFacility[] | undefined,
	inventory: Record<number, number>,
): ProductionCycleResult {
	if (!facilities || facilities.length === 0) {
		return { error: "No facilities available to produce" };
	}

	const active = facilities.filter((f) => f.active !== false);
	if (active.length === 0) {
		return { error: "All facilities are currently inactive" };
	}

	const fac = active[Math.floor(Math.random() * active.length)]!;
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

	return { facility: fac.name, output: outType, quantity: outQty };
}
