import { BaseRecipe } from "./recipies.ts";
import { Resources } from "./resources.ts";

/**
 * Null / placeholder recipe template.
 */
export const nullRecipe = new BaseRecipe("Null Recipe", {}, Resources.Food, 1);

export const grainRecipe = new BaseRecipe(
	"Manual Grain Farm",
	{ [Resources.Water]: 300 },
	Resources.Grain,
	150,
);

export const waterPump = new BaseRecipe("Water Pump", {}, Resources.Water, 500);

export const geothermalPlant = new BaseRecipe(
	"Geothermal Power Plant",
	{ [Resources.Water]: 100 },
	Resources.Electricity,
	200,
);

export const electricWaterPump = new BaseRecipe(
	"Electric Water Pump",
	{ [Resources.Electricity]: 200 },
	Resources.Water,
	3000,
);

export const prePackedFood = new BaseRecipe(
	"Pre Packaged Food",
	{
		[Resources.Electricity]: 550,
		[Resources.Water]: 1000,
		[Resources.Grain]: 100,
	},
	Resources.Food,
	25,
);

/**
 * Registry of base production recipes available in the economy.
 */
export const BASE_RECIPIES: Record<string, BaseRecipe> = {
	null: nullRecipe,
	manual_grain_farm: grainRecipe,
	water_pump: waterPump,
	geothermal_plant: geothermalPlant,
	electric_water_pump: electricWaterPump,
	pre_packaged_food: prePackedFood,
};
