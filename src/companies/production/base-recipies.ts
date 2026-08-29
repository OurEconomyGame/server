import { BaseRecipe } from "./recipies.ts";
import { Resources } from "./resources.ts";

/**
 * Null / placeholder recipe template.
 */
export const nullRecipe = new BaseRecipe("Null Recipe", {}, Resources.Food, 1);

/**
 * Registry of base production recipes available in the economy.
 */
export const BASE_RECIPIES: Record<string, BaseRecipe> = {
	null: nullRecipe,
};
