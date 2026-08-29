import { describe, expect, test } from "bun:test";
import { waterPump } from "../src/companies/production/base-recipies.ts";
import { Facility } from "../src/companies/production/facilities.ts";
import { BaseRecipe } from "../src/companies/production/recipies.ts";
import { Resources } from "../src/companies/production/resources.ts";

describe("Production Facility Model", () => {
	test("creates a Facility with its own isolated copy of a recipe and constructionCost", () => {
		const pump = new Facility(
			"fac-1",
			"Water Extraction Well",
			waterPump,
			{
				[Resources.Metal]: 50,
				[Resources.Cement]: 100,
			},
			1,
			true,
		);

		expect(pump.id).toBe("fac-1");
		expect(pump.name).toBe("Water Extraction Well");
		expect(pump.level).toBe(1);
		expect(pump.active).toBe(true);

		expect(pump.constructionCost[Resources.Metal]).toBe(50);
		expect(pump.constructionCost[Resources.Cement]).toBe(100);
		expect(pump.constructionCost[Resources.Food]).toBe(0);

		expect(pump.recipe).toBeInstanceOf(BaseRecipe);
		expect(pump.recipe.name).toBe("Water Pump");
		expect(pump.recipe.outputType).toBe(Resources.Water);
		expect(pump.recipe.outputQuant).toBe(500);

		// Modifying the facility recipe must NOT mutate the base recipe
		pump.recipe.inputs[Resources.Electricity] = 50;
		expect(waterPump.inputs[Resources.Electricity]).toBe(0);
	});

	test("canConstruct checks inventory for required construction materials", () => {
		const facility = new Facility(
			"fac-mining",
			"Ore Mine",
			waterPump,
			{ [Resources.Cement]: 200, [Resources.Metal]: 100 },
			1,
			true,
		);

		const validInventory = {
			[Resources.Cement]: 300,
			[Resources.Metal]: 150,
		};
		expect(facility.canConstruct(validInventory)).toBe(true);

		const insufficientInventory = {
			[Resources.Cement]: 100,
			[Resources.Metal]: 150,
		};
		expect(facility.canConstruct(insufficientInventory)).toBe(false);
	});

	test("serializes to and from JSON correctly including constructionCost", () => {
		const original = new Facility(
			"fac-2",
			"Power Unit",
			new BaseRecipe(
				"Power Generator",
				{ [Resources.Water]: 50 },
				Resources.Electricity,
				300,
			),
			{ [Resources.Metal]: 25 },
			2,
			false,
		);
		const json = original.toJSON();

		expect(json.id).toBe("fac-2");
		expect(json.name).toBe("Power Unit");
		expect(json.level).toBe(2);
		expect(json.active).toBe(false);
		expect(json.constructionCost[Resources.Metal]).toBe(25);
		expect(json.recipe.name).toBe("Power Generator");
		expect(json.recipe.outputQuant).toBe(300);

		const deserialized = Facility.fromJSON(json);
		expect(deserialized.id).toBe("fac-2");
		expect(deserialized.name).toBe("Power Unit");
		expect(deserialized.level).toBe(2);
		expect(deserialized.active).toBe(false);
		expect(deserialized.constructionCost[Resources.Metal]).toBe(25);
		expect(deserialized.recipe).toBeInstanceOf(BaseRecipe);
		expect(deserialized.recipe.name).toBe("Power Generator");
		expect(deserialized.recipe.outputQuant).toBe(300);
	});
});
