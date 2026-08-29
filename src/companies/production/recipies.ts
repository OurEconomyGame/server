import { Resources } from "./resources.ts";

/**
 * Mapping of each possible resource to required input quantity (minimum 0).
 */
export type RecipeInputs = Record<Resources, number>;

/**
 * Interface definition for a production recipe.
 */
export interface IBaseRecipe {
	name: string;
	inputs: RecipeInputs;
	outputType: Resources;
	outputQuant: number;
}

/**
 * Template and model representing a production recipe with input requirements and single output.
 */
export class BaseRecipe implements IBaseRecipe {
	public readonly name: string;
	public readonly inputs: RecipeInputs;
	public readonly outputType: Resources;
	public readonly outputQuant: number;

	constructor(
		name: string,
		inputs: Partial<RecipeInputs>,
		outputType: Resources,
		outputQuant: number,
	) {
		if (!name || name.trim() === "") {
			throw new Error("Recipe name cannot be empty");
		}
		if (outputQuant <= 0) {
			throw new Error("Recipe outputQuant must be greater than 0");
		}

		this.name = name.trim();
		this.outputType = outputType;
		this.outputQuant = outputQuant;

		// Initialize input for every possible resource with a minimum value of 0
		this.inputs = {
			[Resources.Food]: Math.max(0, inputs[Resources.Food] ?? 0),
			[Resources.Water]: Math.max(0, inputs[Resources.Water] ?? 0),
			[Resources.Grain]: Math.max(0, inputs[Resources.Grain] ?? 0),
			[Resources.Electricity]: Math.max(0, inputs[Resources.Electricity] ?? 0),
			[Resources.Cement]: Math.max(0, inputs[Resources.Cement] ?? 0),
			[Resources.Metal]: Math.max(0, inputs[Resources.Metal] ?? 0),
			[Resources.RawOre]: Math.max(0, inputs[Resources.RawOre] ?? 0),
		};
	}

	/**
	 * Checks whether an inventory has sufficient resource quantities to fulfill this recipe.
	 *
	 * @param inventory - Current resource quantities.
	 * @returns True if all inputs are met, false otherwise.
	 */
	public canCraft(inventory: Partial<Record<Resources, number>>): boolean {
		for (const [resKey, required] of Object.entries(this.inputs)) {
			const resource = Number(resKey) as Resources;
			const available = inventory[resource] ?? 0;
			if (available < required) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Consumes input resources and produces output quantity on a given inventory object.
	 *
	 * @param inventory - Mutable inventory map to modify.
	 * @returns True if crafting succeeded, false if insufficient inputs.
	 */
	public execute(inventory: Record<Resources, number>): boolean {
		if (!this.canCraft(inventory)) {
			return false;
		}

		for (const [resKey, required] of Object.entries(this.inputs)) {
			const resource = Number(resKey) as Resources;
			inventory[resource] = (inventory[resource] ?? 0) - required;
		}

		inventory[this.outputType] =
			(inventory[this.outputType] ?? 0) + this.outputQuant;

		return true;
	}
}
