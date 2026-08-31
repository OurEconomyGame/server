import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { isCompanyCeo } from "../auth.ts";
import { companyTypes } from "../helpers/types.ts";
import { calculateFacilityCost } from "./buy.ts";
import type { IFacility } from "./facilities.ts";
import { BaseRecipe } from "./recipies.ts";

export interface SellFacilityParams {
	company_id?: number;
	company?: number;
	facility_id?: string;
	id?: string;
}

export interface SellFacilityResponse {
	status: string;
	facility_id?: string;
	refund?: number;
	balance?: number;
	remaining_facilities?: number;
}

/**
 * Sells/decommissions a production facility owned by a company and refunds its purchase cash value.
 * Validates caller CEO status, Production company type, and facility existence.
 *
 * @param params - Payload containing company ID and facility ID.
 * @param auth_token - Session token from request headers.
 * @returns Result object indicating refund amount and remaining facilities.
 */
export async function sellFacility(
	params: unknown,
	auth_token: string | null,
): Promise<SellFacilityResponse> {
	const token = auth_token ?? "";
	const user = await getUserBySessionToken(token);

	if (!user) {
		return { status: "Sorry, ghosts cant sell facilities" };
	}

	if (!params || typeof params !== "object") {
		return { status: "Invalid request payload" };
	}

	const p = params as SellFacilityParams;
	const companyId =
		typeof p.company_id === "number"
			? p.company_id
			: typeof p.company === "number"
				? p.company
				: null;

	if (companyId === null) {
		return { status: "Missing company ID" };
	}

	const facilityId = p.facility_id ?? p.id;
	if (typeof facilityId !== "string" || facilityId.trim() === "") {
		return { status: "Missing facility ID" };
	}

	const isCeo = await isCompanyCeo(auth_token, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can sell facilities for this company" };
	}

	const company = await getCompanyById(companyId);
	if (!company) {
		return { status: "Company not found" };
	}

	if (company.type !== companyTypes.Production) {
		return { status: "Only Production companies can sell facilities" };
	}

	const companyData = (company.data ?? {}) as Record<string, unknown>;
	const existingFacilities = Array.isArray(companyData.facilities)
		? (companyData.facilities as IFacility[])
		: [];

	const targetIndex = existingFacilities.findIndex(
		(f) => f.id === facilityId.trim(),
	);
	if (targetIndex === -1) {
		return { status: `Facility not found: ${facilityId.trim()}` };
	}

	const targetFacility = existingFacilities[targetIndex];
	if (targetFacility === null || targetFacility === undefined)
		return { status: "Facility is in the void, if it ever existed that is?" };
	const recipeInstance = new BaseRecipe(
		targetFacility.recipe.name,
		targetFacility.recipe.inputs,
		targetFacility.recipe.outputType,
		targetFacility.recipe.outputQuant,
	);
	const refund = calculateFacilityCost(recipeInstance) / 10;

	const updatedFacilities = existingFacilities.filter(
		(_, idx) => idx !== targetIndex,
	);
	const newCash = company.cash + refund;

	const updatedCompany = await updateCompanyById(company.id, {
		cash: newCash,
		data: {
			...companyData,
			facilities: updatedFacilities,
		},
	});

	if (!updatedCompany) {
		return {
			status: "Failed to update company record during facility sale",
		};
	}

	return {
		status: "Success",
		facility_id: targetFacility.id,
		refund,
		balance: newCash,
		remaining_facilities: updatedFacilities.length,
	};
}
