import { BaseRecipe, type IBaseRecipe, type RecipeInputs } from "./recipies.ts";
import { Resources } from "./resources.ts";

/**
 * Interface representing serializable facility data with an embedded recipe copy and construction cost.
 */
export interface IFacility {
	id: string;
	name: string;
	recipe: IBaseRecipe;
	constructionCost: RecipeInputs;
	level: number;
	active: boolean;
	last_used_day: number;
}

/**
 * Represents a production facility owned by a company that runs its own mutable copy of a production recipe.
 */
export class Facility implements IFacility {
	public id: string;
	public name: string;
	public recipe: BaseRecipe;
	public constructionCost: RecipeInputs;
	public level: number;
	public last_used_day: number;
	public active: boolean;

	constructor(
		id: string,
		name: string,
		recipe: BaseRecipe | IBaseRecipe,
		constructionCost: Partial<RecipeInputs> = {},
		level = 1,
		active = true,
		last_used_day = 0,
	) {
		this.id = id;
		this.name = name;
		// Clone recipe to guarantee each facility has its own isolated, mutable copy
		this.recipe = new BaseRecipe(
			recipe.name,
			recipe.inputs,
			recipe.outputType,
			recipe.outputQuant,
		);
		this.constructionCost = {
			[Resources.Food]: Math.max(0, constructionCost[Resources.Food] ?? 0),
			[Resources.Water]: Math.max(0, constructionCost[Resources.Water] ?? 0),
			[Resources.Grain]: Math.max(0, constructionCost[Resources.Grain] ?? 0),
			[Resources.Electricity]: Math.max(
				0,
				constructionCost[Resources.Electricity] ?? 0,
			),
			[Resources.Cement]: Math.max(0, constructionCost[Resources.Cement] ?? 0),
			[Resources.Metal]: Math.max(0, constructionCost[Resources.Metal] ?? 0),
			[Resources.RawOre]: Math.max(0, constructionCost[Resources.RawOre] ?? 0),
		};
		this.level = Math.max(1, level);
		this.active = active;
		this.last_used_day = last_used_day; //Basically forever ago.
	}

	/**
	 * Checks if the given inventory has sufficient materials to build this facility.
	 *
	 * @param inventory - Current resource quantities.
	 * @returns True if all construction cost requirements are met, false otherwise.
	 */
	public canConstruct(inventory: Partial<Record<Resources, number>>): boolean {
		for (const [resKey, required] of Object.entries(this.constructionCost)) {
			const resource = Number(resKey) as Resources;
			const available = inventory[resource] ?? 0;
			if (available < required) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Serializes the facility instance to a plain JSON object.
	 */
	public toJSON(): IFacility {
		return {
			id: this.id,
			name: this.name,
			recipe: {
				name: this.recipe.name,
				inputs: { ...this.recipe.inputs },
				outputType: this.recipe.outputType,
				outputQuant: this.recipe.outputQuant,
			},
			constructionCost: { ...this.constructionCost },
			level: this.level,
			active: this.active,
			last_used_day: this.last_used_day,
		};
	}

	/**
	 * Deserializes a plain JSON object into a Facility class instance with its own BaseRecipe copy.
	 */
	public static fromJSON(json: IFacility): Facility {
		return new Facility(
			json.id,
			json.name,
			json.recipe,
			json.constructionCost,
			json.level,
			json.active,
			json.last_used_day,
		);
	}
}
