import { BaseRecipe, type IBaseRecipe } from "./recipies.ts";

/**
 * Interface representing serializable facility data with an embedded recipe copy.
 */
export interface IFacility {
	id: string;
	name: string;
	recipe: IBaseRecipe;
	level: number;
	active: boolean;
}

/**
 * Represents a production facility owned by a company that runs its own mutable copy of a production recipe.
 */
export class Facility implements IFacility {
	public id: string;
	public name: string;
	public recipe: BaseRecipe;
	public level: number;
	public active: boolean;

	constructor(
		id: string,
		name: string,
		recipe: BaseRecipe | IBaseRecipe,
		level = 1,
		active = true,
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
		this.level = Math.max(1, level);
		this.active = active;
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
			level: this.level,
			active: this.active,
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
			json.level,
			json.active,
		);
	}
}
