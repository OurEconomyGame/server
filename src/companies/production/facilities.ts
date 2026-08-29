import { BASE_RECIPIES } from "./base-recipies.ts";
import type { BaseRecipe } from "./recipies.ts";

/**
 * Interface representing serializable facility data.
 */
export interface IFacility {
	id: string;
	name: string;
	recipe_key: string;
	level: number;
	active: boolean;
}

/**
 * Represents a production facility owned by a company that runs production recipes.
 */
export class Facility implements IFacility {
	public id: string;
	public name: string;
	public recipe_key: string;
	public level: number;
	public active: boolean;

	constructor(
		id: string,
		name: string,
		recipe_key: string,
		level = 1,
		active = true,
	) {
		this.id = id;
		this.name = name;
		this.recipe_key = recipe_key;
		this.level = Math.max(1, level);
		this.active = active;
	}

	/**
	 * Resolves the assigned recipe instance from the base recipe registry.
	 *
	 * @returns The BaseRecipe associated with this facility, or undefined.
	 */
	public getRecipe(): BaseRecipe | undefined {
		return BASE_RECIPIES[this.recipe_key];
	}

	/**
	 * Serializes the facility instance to a plain JSON object.
	 */
	public toJSON(): IFacility {
		return {
			id: this.id,
			name: this.name,
			recipe_key: this.recipe_key,
			level: this.level,
			active: this.active,
		};
	}

	/**
	 * Deserializes a plain JSON object into a Facility class instance.
	 */
	public static fromJSON(json: IFacility): Facility {
		return new Facility(
			json.id,
			json.name,
			json.recipe_key,
			json.level,
			json.active,
		);
	}
}
