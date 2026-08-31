import { getCompanyById } from "../../db/gets.ts";
import { companyTypes } from "../helpers/types.ts";
import type { WebStoreData } from "./types.ts";

export interface WebStorePublicInfo {
	status: string;
	company_id?: number;
	name?: string;
	price?: number;
	food_price?: number;
	inventory?: Record<number, number>;
}

/**
 * Retrieves public pricing and inventory for a WebStore.
 *
 * @param params - Query parameters (?company_id= or ?id=).
 * @returns Object with store public details.
 */
export async function handleGetStoreInfo(
	params?: Record<string, string> | null,
): Promise<WebStorePublicInfo> {
	if (!params || (!params.company_id && !params.id)) {
		return { status: "Missing company_id or id parameter" };
	}

	const compId = Number(params.company_id ?? params.id);
	if (!Number.isFinite(compId) || compId <= 0) {
		return { status: "Invalid company_id" };
	}

	const company = await getCompanyById(compId);
	if (!company) {
		return { status: "Company not found" };
	}

	if (company.type !== companyTypes.WebStore) {
		return { status: "Company is not a WebStore" };
	}

	const data = (company.data ?? {}) as WebStoreData;
	const price =
		typeof data.price === "number" && Number.isFinite(data.price)
			? data.price
			: typeof data.food_price === "number" &&
					Number.isFinite(data.food_price)
				? data.food_price
				: 10;

	return {
		status: "Success",
		company_id: company.id,
		name: company.name,
		price,
		food_price: price,
		inventory: (data.inventory ?? {}) as Record<number, number>,
	};
}
