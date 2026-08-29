import { describe, expect, test } from "bun:test";
import { waterPump } from "../src/companies/production/base-recipies.ts";
import { Facility } from "../src/companies/production/facilities.ts";
import { BaseRecipe } from "../src/companies/production/recipies.ts";
import { Resources } from "../src/companies/production/resources.ts";

describe("Production Facility Model", () => {
	test("creates a Facility with its own isolated copy of a recipe", () => {
		const pump = new Facility(
			"fac-1",
			"Water Extraction Well",
			waterPump,
			1,
			true,
		);

		expect(pump.id).toBe("fac-1");
		expect(pump.name).toBe("Water Extraction Well");
		expect(pump.level).toBe(1);
		expect(pump.active).toBe(true);

		expect(pump.recipe).toBeInstanceOf(BaseRecipe);
		expect(pump.recipe.name).toBe("Water Pump");
		expect(pump.recipe.outputType).toBe(Resources.Water);
		expect(pump.recipe.outputQuant).toBe(500);

		// Modifying the facility recipe must NOT mutate the base recipe
		pump.recipe.inputs[Resources.Electricity] = 50;
		expect(waterPump.inputs[Resources.Electricity]).toBe(0);
	});

	test("serializes to and from JSON correctly", () => {
		const original = new Facility(
			"fac-2",
			"Power Unit",
			new BaseRecipe(
				"Power Generator",
				{ [Resources.Water]: 50 },
				Resources.Electricity,
				300,
			),
			2,
			false,
		);
		const json = original.toJSON();

		expect(json.id).toBe("fac-2");
		expect(json.name).toBe("Power Unit");
		expect(json.level).toBe(2);
		expect(json.active).toBe(false);
		expect(json.recipe.name).toBe("Power Generator");
		expect(json.recipe.outputQuant).toBe(300);

		const deserialized = Facility.fromJSON(json);
		expect(deserialized.id).toBe("fac-2");
		expect(deserialized.name).toBe("Power Unit");
		expect(deserialized.level).toBe(2);
		expect(deserialized.active).toBe(false);
		expect(deserialized.recipe).toBeInstanceOf(BaseRecipe);
		expect(deserialized.recipe.name).toBe("Power Generator");
		expect(deserialized.recipe.outputQuant).toBe(300);
	});
});
