import { getCompanyById } from "../../db/gets.ts";
import { updateCompanyById, updateUserById } from "../../db/updates.ts";
import { getUserBySessionToken } from "../../sessions/check.ts";
import { addCompanyDataLog } from "../helpers/logs.ts";
import { companyTypes } from "../helpers/types.ts";
import { Resources } from "../production/resources.ts";
import type { StoreBuyResult, WebStoreData } from "./types.ts";

export async function buyFromWebstore(
	companyId: number,
	quantity: number,
	authToken: string | null,
): Promise<StoreBuyResult> {
	if (!authToken) return { status: "Authentication token required" };
	if (!Number.isFinite(companyId) || companyId <= 0)
		return { status: "Invalid company_id" };
	if (!Number.isFinite(quantity) || quantity <= 0)
		return { status: "Quantity must be greater than 0" };

	const [user, company] = await Promise.all([
		getUserBySessionToken(authToken),
		getCompanyById(companyId),
	]);
	if (!user) return { status: "Invalid session token" };
	if (!company) return { status: "Company not found" };
	if (company.type !== companyTypes.WebStore)
		return { status: "Company is not a WebStore" };

	const data = (company.data ?? {}) as WebStoreData;
	data.inventory = data.inventory ?? {};
	const foodStock = data.inventory[Resources.Food] ?? 0;
	const elecStock = data.inventory[Resources.Electricity] ?? 0;
	const requiredElec = 10 + quantity;

	if (foodStock < quantity)
		return { status: `Insufficient food stock. Available: ${foodStock}` };
	if (elecStock < requiredElec)
		return { status: `Insufficient electricity. Available: ${elecStock}` };

	const price = data.food_price ?? data.price ?? 10;
	const totalCost = price * quantity;
	if (user.cash < totalCost)
		return { status: `Insufficient cash. Available: $${user.cash}` };

	user.cash -= totalCost;
	company.cash += totalCost;
	const inv = data.inventory ?? {};
	inv[Resources.Food] = foodStock - quantity;
	inv[Resources.Electricity] = elecStock - requiredElec;
	data.inventory = inv;

	addCompanyDataLog(
		data,
		`Sold ${quantity} Food to user ${user.name} for $${totalCost}`,
	);

	const uData = (user.data ?? {}) as { inventory?: Record<number, number> };
	uData.inventory = uData.inventory ?? {};
	uData.inventory[Resources.Food] =
		(uData.inventory[Resources.Food] ?? 0) + quantity;

	await updateUserById(user.id, { cash: user.cash, data: uData });
	await updateCompanyById(company.id, { cash: company.cash, data });

	return {
		status: "Success",
		quantity,
		price,
		total_cost: totalCost,
		electricity_used: requiredElec,
		buyer_cash: user.cash,
		store_cash: company.cash,
	};
}
