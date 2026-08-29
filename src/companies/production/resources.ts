/**
 * Core resource types available for company production recipes.
 */
export enum Resources {
	Food = 0,
	Water = 1,
	Grain = 2,
	Electricity = 3,
	Cement = 4,
	Metal = 5,
	RawOre = 6,
}

/**
 * Human-readable names mapped to resource enum values.
 */
export const RESOURCE_NAMES: Record<Resources, string> = {
	[Resources.Food]: "Food",
	[Resources.Water]: "Water",
	[Resources.Grain]: "Grain",
	[Resources.Electricity]: "Electricity",
	[Resources.Cement]: "Cement",
	[Resources.Metal]: "Metal",
	[Resources.RawOre]: "RawOre",
};
