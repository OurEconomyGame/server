import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { isCompanyCeo } from "../auth.ts";
import { addCompanyDataLog } from "../helpers/logs.ts";
import { companyTypes } from "../helpers/types.ts";
import { BASE_RECIPIES } from "./base-recipies.ts";
import { Facility, type IFacility } from "./facilities.ts";
import type { BaseRecipe } from "./recipies.ts";
import { Resources } from "./resources.ts";

/**
 * Computes the flat purchase cost for a facility based on its recipe inputs:
 * - 2000 for any facility that takes electricity as an input
 * - 500 for any facility with inputs (non-electric)
 * - 200 for any facility that takes no inputs
 *
 * @param recipe - The BaseRecipe to evaluate.
 * @returns Cost in cash.
 */
export function calculateFacilityCost(recipe: BaseRecipe): number {
	if ((recipe.inputs[Resources.Electricity] ?? 0) > 0) {
		return 2000;
	}

	const hasInputs = Object.values(recipe.inputs).some((val) => (val ?? 0) > 0);
	if (hasInputs) {
		return 500;
	}

	return 200;
}

export interface BuyFacilityParams {
	company_id?: number;
	company?: number;
	recipe?: string;
	recipe_id?: string;
	recipe_key?: string;
	name?: string;
}

export interface BuyFacilityResponse {
	status: string;
	facility_id?: string;
	cost?: number;
	balance?: number;
}

/**
 * Purchases a new production facility for a company.
 * Validates caller CEO status, Production company type, and sufficient company funds.
 *
 * @param params - The purchase parameters containing company ID and recipe key.
 * @param auth_token - Session token from request headers.
 * @returns An object indicating the purchase result and facility ID.
 */
export async function buyFacility(
	params: unknown,
	auth_token: string | null,
): Promise<BuyFacilityResponse> {
	const token = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	if (!user) {
		return { status: "Sorry, ghosts cant buy facilities" };
	}

	if (!params || typeof params !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = params as BuyFacilityParams;
	const companyId =
		typeof p.company_id === "number"
			? p.company_id
			: typeof p.company === "number"
				? p.company
				: null;

	if (companyId === null) {
		return { status: "Missing company ID" };
	}

	const rawRecipeKey = p.recipe ?? p.recipe_id ?? p.recipe_key;
	if (typeof rawRecipeKey !== "string" || rawRecipeKey.trim() === "") {
		return { status: "Missing facility recipe" };
	}

	const recipeKey = rawRecipeKey.trim();
	const recipe = BASE_RECIPIES[recipeKey];

	if (!recipe) {
		return { status: `Unknown facility recipe: ${recipeKey}` };
	}

	const isCeo = await isCompanyCeo(auth_token, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can purchase facilities for this company" };
	}

	const company = await getCompanyById(companyId);
	if (!company) {
		return { status: "Company not found" };
	}

	if (company.type !== companyTypes.Production) {
		return { status: "Only Production companies can buy facilities" };
	}

	const cost = calculateFacilityCost(recipe);

	if (company.cash < cost) {
		return {
			status: `Insufficient company funds. Required: $${cost}, available: $${company.cash}`,
		};
	}

	const facilityName =
		typeof p.name === "string" && p.name.trim() !== ""
			? p.name.trim()
			: `${recipe.name} Facility`;

	const facilityId = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
	const facility = new Facility(facilityId, facilityName, recipe, {}, 1, true);

	const companyData = (company.data ?? {}) as Record<string, unknown>;
	const existingFacilities = Array.isArray(companyData.facilities)
		? (companyData.facilities as IFacility[])
		: [];

	const updatedFacilities = [...existingFacilities, facility.toJSON()];
	const newCash = company.cash - cost;

	addCompanyDataLog(
		companyData,
		`Purchased facility '${facilityName}' (${recipe.name}) for $${cost}`,
	);

	const updatedCompany = await updateCompanyById(company.id, {
		cash: newCash,
		data: {
			...companyData,
			facilities: updatedFacilities,
		},
	});

	if (!updatedCompany) {
		return { status: "Failed to update company record during purchase" };
	}

	return {
		status: "Success",
		facility_id: facility.id,
		cost,
		balance: newCash,
	};
}
