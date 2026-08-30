import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { isCompanyCeo } from "../auth.ts";
import { companyTypes } from "../helpers/types.ts";
import type { WebStoreData } from "./types.ts";

/**
 * Sets the Food retail selling price for a WebStore (CEO only).
 */
export async function setWebstorePrice(
	companyId: number,
	price: number,
	authToken: string | null,
): Promise<Record<string, unknown>> {
	if (!Number.isFinite(companyId) || companyId <= 0) {
		return { status: "Invalid company_id" };
	}
	if (!Number.isFinite(price) || price <= 0) {
		return { status: "Price must be a positive number" };
	}

	const isCeo = await isCompanyCeo(authToken, companyId);
	if (!isCeo) {
		return { status: "Only the CEO can set store prices" };
	}

	const company = await getCompanyById(companyId);
	if (!company) return { status: "Company not found" };
	if (company.type !== companyTypes.WebStore) {
		return { status: "Company is not a WebStore" };
	}

	const data = (company.data ?? {}) as WebStoreData;
	data.food_price = price;
	data.price = price;

	await updateCompanyById(companyId, { data });
	return { status: "Success", price };
}
