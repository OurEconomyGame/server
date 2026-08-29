import { beforeAll, describe, expect, test } from "bun:test";
import { Resources } from "../src/companies/production/resources.ts";
import { deleteOfferById, deleteOrderById } from "../src/db/deletes.ts";
import { initDb } from "../src/db/init.ts";
import { insertOffer, insertOrder } from "../src/db/inserts.ts";
import {
	getAllOffersByCompany,
	getAllOffersByResource,
	getAllOrdersByCompany,
	getAllOrdersByResource,
	getNextOfferId,
	getNextOrderId,
} from "../src/market/index.ts";

beforeAll(async () => {
	await initDb();
});

describe("Market Orders & Offers Suite", () => {
	test("getAllOrdersByResource sorts buy orders from highest to lowest price", async () => {
		const compId = 888;
		const id1 = await getNextOrderId();
		await insertOrder(id1, compId, Resources.Water, 100, 1.5);
		const id2 = id1 + 1;
		await insertOrder(id2, compId, Resources.Water, 50, 4.0);
		const id3 = id2 + 1;
		await insertOrder(id3, compId, Resources.Water, 200, 2.25);

		const orders = await getAllOrdersByResource(Resources.Water);
		expect(orders.length).toBeGreaterThanOrEqual(3);

		// Check sorting: highest price first
		for (let i = 0; i < orders.length - 1; i++) {
			const current = orders[i];
			const next = orders[i + 1];
			if (current && next) {
				expect(current.unitPrice).toBeGreaterThanOrEqual(next.unitPrice);
			}
		}

		await deleteOrderById(id1);
		await deleteOrderById(id2);
		await deleteOrderById(id3);
	});

	test("getAllOffersByResource sorts sell offers from lowest to highest price", async () => {
		const compId = 999;
		const id1 = await getNextOfferId();
		await insertOffer(id1, compId, Resources.Electricity, 500, 10.0);
		const id2 = id1 + 1;
		await insertOffer(id2, compId, Resources.Electricity, 300, 2.5);
		const id3 = id2 + 1;
		await insertOffer(id3, compId, Resources.Electricity, 1000, 5.75);

		const offers = await getAllOffersByResource(Resources.Electricity);
		expect(offers.length).toBeGreaterThanOrEqual(3);

		// Check sorting: lowest price first
		for (let i = 0; i < offers.length - 1; i++) {
			const current = offers[i];
			const next = offers[i + 1];
			if (current && next) {
				expect(current.unitPrice).toBeLessThanOrEqual(next.unitPrice);
			}
		}

		await deleteOfferById(id1);
		await deleteOfferById(id2);
		await deleteOfferById(id3);
	});

	test("getAllOrdersByCompany and getAllOffersByCompany filter correctly by company ID", async () => {
		const targetCompanyId = 7771;
		const otherCompanyId = 7772;

		const oId1 = await getNextOrderId();
		await insertOrder(oId1, targetCompanyId, Resources.Grain, 500, 3.0);
		const oId2 = oId1 + 1;
		await insertOrder(oId2, otherCompanyId, Resources.Grain, 200, 3.5);

		const fId1 = await getNextOfferId();
		await insertOffer(fId1, targetCompanyId, Resources.Cement, 100, 8.0);
		const fId2 = fId1 + 1;
		await insertOffer(fId2, otherCompanyId, Resources.Cement, 400, 7.5);

		const companyOrders = await getAllOrdersByCompany(targetCompanyId);
		expect(companyOrders.some((o) => o.id === oId1)).toBe(true);
		expect(companyOrders.every((o) => o.company_id === targetCompanyId)).toBe(
			true,
		);

		const companyOffers = await getAllOffersByCompany(targetCompanyId);
		expect(companyOffers.some((f) => f.id === fId1)).toBe(true);
		expect(companyOffers.every((f) => f.company_id === targetCompanyId)).toBe(
			true,
		);

		await deleteOrderById(oId1);
		await deleteOrderById(oId2);
		await deleteOfferById(fId1);
		await deleteOfferById(fId2);
	});
});
