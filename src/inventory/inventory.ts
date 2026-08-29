import { Resources } from "../companies/production/resources.ts";

/**
 * Standard resource inventory map where each resource key has a non-negative quantity.
 */
export type ResourceInventory = Record<Resources, number>;

/**
 * Creates a clean default inventory map with all resources initialized to 0.
 *
 * @returns Inventory object with 0 for all Resources enum keys.
 */
export function createEmptyInventory(): ResourceInventory {
	return {
		[Resources.Food]: 0,
		[Resources.Water]: 0,
		[Resources.Grain]: 0,
		[Resources.Electricity]: 0,
		[Resources.Cement]: 0,
		[Resources.Metal]: 0,
		[Resources.RawOre]: 0,
	};
}
