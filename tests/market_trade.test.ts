import { beforeAll, describe, expect, test } from "bun:test";
import { Resources } from "../src/companies/production/resources.ts";
import { deleteCompanyById, deleteUserById } from "../src/db/deletes.ts";
import { getCompanyById, getOfferById, getOrderById } from "../src/db/gets.ts";
import { initDb } from "../src/db/init.ts";
import { insertCompany, insertUser } from "../src/db/inserts.ts";
import { executeBuy, executeSell } from "../src/market/index.ts";

beforeAll(async () => {
	await initDb();
});

describe("Market Buy and Sell Execution Engine", () => {
	test("executeBuy matches sell offers lowest price first, settles companies, and rests remainder", async () => {
		const userId = 9001;
		const buyerCompId = 5001;
		const seller1CompId = 5002;
		const seller2CompId = 5003;

		await insertUser(userId, "u9001", "p", "e1", 0, 0, {}, 0);
		await insertCompany(
			buyerCompId,
			"Buyer Co",
			userId,
			0,
			0,
			10000,
			0,
			userId,
			{ inventory: {} },
			100,
		);
		await insertCompany(
			seller1CompId,
			"Seller Cheap",
			userId,
			0,
			0,
			100,
			0,
			userId,
			{ inventory: { [Resources.Water]: 100 } },
			100,
		);
		await insertCompany(
			seller2CompId,
			"Seller Expensive",
			userId,
			0,
			0,
			100,
			0,
			userId,
			{ inventory: { [Resources.Water]: 100 } },
			100,
		);

		// Seller 1 places sell offer: 30 units of Water @ $2.00
		const s1 = await executeSell(seller1CompId, Resources.Water, 30, 2.0);
		expect(s1.success).toBe(true);
		expect(s1.restingOfferId).toBeDefined();

		// Seller 2 places sell offer: 50 units of Water @ $3.00
		const s2 = await executeSell(seller2CompId, Resources.Water, 50, 3.0);
		expect(s2.success).toBe(true);
		expect(s2.restingOfferId).toBeDefined();

		// Buyer executes buy: wants 60 units of Water @ max $4.00
		// Should fill 30 units @ $2.00 ($60 to Seller 1, offer deleted)
		// Should fill 30 units @ $3.00 ($90 to Seller 2, offer reduced to 20 units)
		// Total filled = 60, remaining = 0
		const buyResult = await executeBuy(buyerCompId, Resources.Water, 60, 4.0);
		expect(buyResult.success).toBe(true);
		expect(buyResult.filledQuantity).toBe(60);
		expect(buyResult.remainingQuantity).toBe(0);

		// Verify Buyer: inventory has 60 Water, paid 30*2 + 30*3 = $150 (initial 10000 - 150 = 9850)
		const buyerAfter = await getCompanyById(buyerCompId);
		expect(buyerAfter).not.toBeNull();
		const buyerInv = buyerAfter?.data.inventory as
			| Record<number, number>
			| undefined;
		expect(buyerInv?.[Resources.Water]).toBe(60);
		expect(buyerAfter?.cash).toBe(9850);

		// Verify Seller 1: received $60 (initial 100 + 60 = 160)
		const seller1After = await getCompanyById(seller1CompId);
		expect(seller1After?.cash).toBe(160);
		const s1Id = s1.restingOfferId ?? 0;
		expect(await getOfferById(s1Id)).toBeNull();

		// Verify Seller 2: received $90 (initial 100 + 90 = 190), remaining offer has 20 units
		const seller2After = await getCompanyById(seller2CompId);
		expect(seller2After?.cash).toBe(190);
		const s2Id = s2.restingOfferId ?? 0;
		const s2Offer = await getOfferById(s2Id);
		expect(s2Offer?.quantity).toBe(20);

		await deleteCompanyById(buyerCompId);
		await deleteCompanyById(seller1CompId);
		await deleteCompanyById(seller2CompId);
		await deleteUserById(userId);
	});

	test("executeSell matches buy orders highest price first, settles companies, and rests remainder", async () => {
		const userId = 9002;
		const sellerCompId = 6001;
		const buyerHighId = 6002;
		const buyerLowId = 6003;

		await insertUser(userId, "u9002", "p", "e2", 0, 0, {}, 0);
		await insertCompany(
			sellerCompId,
			"Seller Corp",
			userId,
			0,
			0,
			500,
			0,
			userId,
			{ inventory: { [Resources.Electricity]: 100 } },
			100,
		);
		await insertCompany(
			buyerHighId,
			"Buyer High",
			userId,
			0,
			0,
			2000,
			0,
			userId,
			{ inventory: {} },
			100,
		);
		await insertCompany(
			buyerLowId,
			"Buyer Low",
			userId,
			0,
			0,
			2000,
			0,
			userId,
			{ inventory: {} },
			100,
		);

		// Buyer High places buy order: 25 units @ $8.00
		const bHigh = await executeBuy(buyerHighId, Resources.Electricity, 25, 8.0);
		expect(bHigh.success).toBe(true);

		// Buyer Low places buy order: 40 units @ $5.00
		const bLow = await executeBuy(buyerLowId, Resources.Electricity, 40, 5.0);
		expect(bLow.success).toBe(true);

		// Seller sells 50 units @ min $4.00
		// Should match 25 units @ $8.00 ($200 from high buyer)
		// Should match 25 units @ $5.00 ($125 from low buyer)
		// Total earned = $325 (initial 500 + 325 = 825)
		// Low buyer remaining order: 15 units
		const sellResult = await executeSell(
			sellerCompId,
			Resources.Electricity,
			50,
			4.0,
		);
		expect(sellResult.success).toBe(true);
		expect(sellResult.filledQuantity).toBe(50);
		expect(sellResult.remainingQuantity).toBe(0);

		const sellerAfter = await getCompanyById(sellerCompId);
		expect(sellerAfter?.cash).toBe(825);
		const sellerInv = sellerAfter?.data.inventory as
			| Record<number, number>
			| undefined;
		expect(sellerInv?.[Resources.Electricity]).toBe(50);

		const buyerHighAfter = await getCompanyById(buyerHighId);
		const buyerHighInv = buyerHighAfter?.data.inventory as
			| Record<number, number>
			| undefined;
		expect(buyerHighInv?.[Resources.Electricity]).toBe(25);

		const buyerLowAfter = await getCompanyById(buyerLowId);
		const buyerLowInv = buyerLowAfter?.data.inventory as
			| Record<number, number>
			| undefined;
		expect(buyerLowInv?.[Resources.Electricity]).toBe(25);
		const lowOrderId = bLow.restingOrderId ?? 0;
		const lowOrder = await getOrderById(lowOrderId);
		expect(lowOrder?.quantity).toBe(15);

		await deleteCompanyById(sellerCompId);
		await deleteCompanyById(buyerHighId);
		await deleteCompanyById(buyerLowId);
		await deleteUserById(userId);
	});

	test("executes fractional purchase and selling with floating point quantities and cash", async () => {
		const userId = 9003;
		const sellerId = 7001;
		const buyerId = 7002;

		await insertUser(userId, "u9003", "p", "e3", 0, 125.5, {}, 0);
		await insertCompany(
			sellerId,
			"Fractional Seller",
			userId,
			0,
			0,
			10.25,
			0,
			userId,
			{ inventory: { [Resources.Grain]: 10.5 } },
			100,
		);
		await insertCompany(
			buyerId,
			"Fractional Buyer",
			userId,
			0,
			0,
			50.75,
			0,
			userId,
			{ inventory: { [Resources.Grain]: 0.5 } },
			100,
		);

		// Seller sells 4.75 units of Grain @ $3.20
		const sRes = await executeSell(sellerId, Resources.Grain, 4.75, 3.2);
		expect(sRes.success).toBe(true);

		// Buyer buys 2.5 units of Grain @ max $3.50
		// Match: 2.5 units @ $3.20 = $8.00
		const bRes = await executeBuy(buyerId, Resources.Grain, 2.5, 3.5);
		expect(bRes.success).toBe(true);
		expect(bRes.filledQuantity).toBe(2.5);

		// Buyer paid $8.00 (initial 50.75 - 8.00 = 42.75)
		const buyerAfter = await getCompanyById(buyerId);
		expect(buyerAfter?.cash).toBeCloseTo(42.75);
		const buyerInv = buyerAfter?.data.inventory as Record<number, number>;
		expect(buyerInv[Resources.Grain]).toBeCloseTo(3.0); // 0.5 + 2.5

		// Seller received $8.00 (initial 10.25 + 8.00 = 18.25)
		const sellerAfter = await getCompanyById(sellerId);
		expect(sellerAfter?.cash).toBeCloseTo(18.25);
		const sOffer = await getOfferById(sRes.restingOfferId ?? 0);
		expect(sOffer?.quantity).toBeCloseTo(2.25); // 4.75 - 2.5

		await deleteCompanyById(sellerId);
		await deleteCompanyById(buyerId);
		await deleteUserById(userId);
	});
});
