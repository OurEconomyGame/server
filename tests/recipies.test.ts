import { describe, expect, test } from "bun:test";
import { BaseRecipe } from "../src/companies/production/recipies.ts";
import { Resources } from "../src/companies/production/resources.ts";

describe("BaseRecipe & Resources Production Model", () => {
	test("defines Resources enum correctly", () => {
		expect(Resources.Food).toBe(0);
		expect(Resources.Water).toBe(1);
		expect(Resources.Grain).toBe(2);
		expect(Resources.Electricity).toBe(3);
		expect(Resources.Cement).toBe(4);
		expect(Resources.Metal).toBe(5);
		expect(Resources.RawOre).toBe(6);
	});

	test("instantiates BaseRecipe with default 0 minimums for missing inputs", () => {
		const smelting = new BaseRecipe(
			"Metal Smelting",
			{
				[Resources.RawOre]: 2,
				[Resources.Electricity]: 1,
			},
			Resources.Metal,
			1,
		);

		expect(smelting.name).toBe("Metal Smelting");
		expect(smelting.outputType).toBe(Resources.Metal);
		expect(smelting.outputQuant).toBe(1);
		expect(smelting.inputs[Resources.RawOre]).toBe(2);
		expect(smelting.inputs[Resources.Electricity]).toBe(1);
		expect(smelting.inputs[Resources.Food]).toBe(0);
		expect(smelting.inputs[Resources.Water]).toBe(0);
		expect(smelting.inputs[Resources.Grain]).toBe(0);
		expect(smelting.inputs[Resources.Cement]).toBe(0);
	});

	test("canCraft returns true when inventory meets requirements", () => {
		const breadRecipe = new BaseRecipe(
			"Bread Baking",
			{ [Resources.Grain]: 3, [Resources.Water]: 1 },
			Resources.Food,
			2,
		);

		const inventory = {
			[Resources.Food]: 0,
			[Resources.Water]: 5,
			[Resources.Grain]: 10,
			[Resources.Electricity]: 0,
			[Resources.Cement]: 0,
			[Resources.Metal]: 0,
			[Resources.RawOre]: 0,
		};

		expect(breadRecipe.canCraft(inventory)).toBe(true);

		const insufficientInventory = {
			[Resources.Food]: 0,
			[Resources.Water]: 0,
			[Resources.Grain]: 10,
			[Resources.Electricity]: 0,
			[Resources.Cement]: 0,
			[Resources.Metal]: 0,
			[Resources.RawOre]: 0,
		};

		expect(breadRecipe.canCraft(insufficientInventory)).toBe(false);
	});

	test("execute consumes inputs and adds outputs", () => {
		const recipe = new BaseRecipe(
			"Concrete Mixing",
			{ [Resources.Cement]: 2, [Resources.Water]: 1 },
			Resources.Cement,
			4,
		);

		const inventory = {
			[Resources.Food]: 0,
			[Resources.Water]: 3,
			[Resources.Grain]: 0,
			[Resources.Electricity]: 0,
			[Resources.Cement]: 5,
			[Resources.Metal]: 0,
			[Resources.RawOre]: 0,
		};

		const success = recipe.execute(inventory);
		expect(success).toBe(true);
		expect(inventory[Resources.Cement]).toBe(7); // 5 - 2 + 4 = 7
		expect(inventory[Resources.Water]).toBe(2); // 3 - 1 = 2
	});

	test("BASE_RECIPIES exports all defined production recipes", async () => {
		const { BASE_RECIPIES } = await import(
			"../src/companies/production/base-recipies.ts"
		);
		expect(BASE_RECIPIES.null).toBeDefined();
		expect(BASE_RECIPIES.manual_grain_farm).toBeDefined();
		expect(BASE_RECIPIES.water_pump).toBeDefined();
		expect(BASE_RECIPIES.geothermal_plant).toBeDefined();
		expect(BASE_RECIPIES.electric_water_pump).toBeDefined();
		expect(BASE_RECIPIES.pre_packaged_food).toBeDefined();
		expect(BASE_RECIPIES.water_pump?.outputQuant).toBe(500);
	});
});
