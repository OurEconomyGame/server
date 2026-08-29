import { describe, expect, test } from "bun:test";
import { Facility } from "../src/companies/production/facilities.ts";

describe("Production Facility Model", () => {
	test("creates a Facility and resolves base recipe", () => {
		const pump = new Facility(
			"fac-1",
			"Water Extraction Well",
			"water_pump",
			1,
			true,
		);

		expect(pump.id).toBe("fac-1");
		expect(pump.name).toBe("Water Extraction Well");
		expect(pump.recipe_key).toBe("water_pump");
		expect(pump.level).toBe(1);
		expect(pump.active).toBe(true);

		const recipe = pump.getRecipe();
		expect(recipe).toBeDefined();
		expect(recipe?.name).toBe("Water Pump");
		expect(recipe?.outputQuant).toBe(500);
	});

	test("serializes to and from JSON correctly", () => {
		const original = new Facility(
			"fac-2",
			"Power Unit",
			"geothermal_plant",
			2,
			false,
		);
		const json = original.toJSON();

		expect(json).toEqual({
			id: "fac-2",
			name: "Power Unit",
			recipe_key: "geothermal_plant",
			level: 2,
			active: false,
		});

		const deserialized = Facility.fromJSON(json);
		expect(deserialized.id).toBe("fac-2");
		expect(deserialized.name).toBe("Power Unit");
		expect(deserialized.recipe_key).toBe("geothermal_plant");
		expect(deserialized.level).toBe(2);
		expect(deserialized.active).toBe(false);
	});
});
