import { getAllCompanies } from "../../db/gets.ts";
import { updateCompanyById } from "../../db/updates.ts";
import { companyTypes } from "../helpers/types.ts";
import { Resources } from "../production/resources.ts";
import type { NpcPurchaseResult, WebStoreData } from "./types.ts";

export async function executeNpcPurchase(): Promise<NpcPurchaseResult> {
	const all = await getAllCompanies();
	const stores = all
		.filter((c) => c.type === companyTypes.WebStore)
		.map((c) => {
			const d = (c.data ?? {}) as WebStoreData;
			const inv = d.inventory ?? {};
			const food = inv[Resources.Food] ?? 0;
			const elec = inv[Resources.Electricity] ?? 0;
			const price = d.food_price ?? d.price ?? 10;
			return { c, d, inv, food, elec, price };
		})
		.filter((s) => s.food >= 1 && s.elec >= 11 && s.price > 0);

	if (stores.length === 0)
		return { purchased: false, message: "No stock-ready WebStores found" };

	const minPrice = Math.min(...stores.map((s) => s.price));
	const weighted = stores.map((s) => ({
		...s,
		w: 0.5 ** (Math.max(0, (s.price - minPrice) / minPrice) / 0.1),
	}));
	const totWeight = weighted.reduce((sum, s) => sum + s.w, 0);

	let r = Math.random() * totWeight;
	let chosen = weighted[0]!;
	for (const item of weighted) {
		if (r < item.w) {
			chosen = item;
			break;
		}
		r -= item.w;
	}

	const maxQty = Math.max(
		1,
		Math.min(50, Math.floor(chosen.food), Math.floor(chosen.elec) - 10),
	);
	const qty = Math.floor(Math.random() * maxQty) + 1;
	const reqElec = 10 + qty;
	const rev = chosen.price * qty;

	chosen.inv[Resources.Food] = chosen.food - qty;
	chosen.inv[Resources.Electricity] = chosen.elec - reqElec;
	chosen.d.inventory = chosen.inv;
	chosen.c.cash += rev;

	await updateCompanyById(chosen.c.id, {
		cash: chosen.c.cash,
		data: chosen.d,
	});

	return {
		purchased: true,
		store_id: chosen.c.id,
		store_name: chosen.c.name,
		quantity: qty,
		price: chosen.price,
		revenue: rev,
		electricity_used: reqElec,
	};
}
