import { beforeAll, describe, expect, test } from "bun:test";
import details from "../package.json";
import { Resources } from "../src/companies/production/resources.ts";
import { deleteCompanyById, deleteUserById } from "../src/db/deletes.ts";
import { getSharesByOwner } from "../src/db/gets.ts";
import { initDb } from "../src/db/init.ts";
import { updateCompanyCash, updateUserCash } from "../src/db/updates.ts";
import { addCompanyResource } from "../src/market/index.ts";
import route from "../src/routing.ts";
import { runServerTick } from "../src/ticker.ts";

beforeAll(async () => {
	await initDb();
});

describe("Routing Suite - route(request)", () => {
	describe("1. GET /version", () => {
		test("returns current version from package.json", async () => {
			const req = new Request("http://localhost/version", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.version).toBe(details.version);
		});
	});

	describe("2. GET /openapi.json", () => {
		test("serves openapi specification file with all endpoints", async () => {
			const req = new Request("http://localhost/openapi.json", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.openapi).toBe("3.0.3");
			const paths = data.paths as Record<string, unknown>;
			expect(paths).toHaveProperty("/version");
			expect(paths).toHaveProperty("/list/users");
			expect(paths).toHaveProperty("/list/companies");
			expect(paths).toHaveProperty("/company");
			expect(paths).toHaveProperty("/company/shareholders");
			expect(paths).toHaveProperty("/portfolio");
			expect(paths).toHaveProperty("/signup");
			expect(paths).toHaveProperty("/login");
			expect(paths).toHaveProperty("/found");
			expect(paths).toHaveProperty("/docs");
		});
	});

	describe("3. GET /list/users", () => {
		test("returns public user list response", async () => {
			const req = new Request("http://localhost/list/users", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as unknown[];
			expect(Array.isArray(data)).toBe(true);
		});

		test("sorts users by ID by default", async () => {
			const req = new Request("http://localhost/list/users", { method: "GET" });
			const res = await route(req);
			const data = (await res.json()) as Array<{
				id: number;
				username: string;
			}>;
			for (let i = 1; i < data.length; i++) {
				const prev = data[i - 1];
				const curr = data[i];
				if (prev && curr) {
					expect(prev.id).toBeLessThanOrEqual(curr.id);
				}
			}
		});

		test("sorts users by name when sortBy=name is specified", async () => {
			await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `Zebra_${Date.now()}`, secret: "pass1" }),
				}),
			);
			await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `Alpha_${Date.now()}`, secret: "pass2" }),
				}),
			);

			const req = new Request("http://localhost/list/users?sortBy=name", {
				method: "GET",
			});
			const res = await route(req);
			const data = (await res.json()) as Array<{
				id: number;
				username: string;
			}>;
			for (let i = 1; i < data.length; i++) {
				const prev = data[i - 1];
				const curr = data[i];
				if (prev && curr) {
					expect(
						prev.username.localeCompare(curr.username),
					).toBeLessThanOrEqual(0);
				}
			}
		});
	});

	describe("4. POST /create/user (/signup)", () => {
		test("rejects signup request from non-napp9.com domains with error code 666", async () => {
			const originalDebug = process.env.DEBUG;
			delete process.env.DEBUG;
			try {
				const req = new Request("http://localhost/signup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Host: "localhost",
						Origin: "http://localhost",
					},
					body: JSON.stringify({ hi: "some_user", secret: "pass" }),
				});
				const res = await route(req);
				expect(res.status).toBe(403);
				expect(res.headers.get("X-Error-Code")).toBe("666");
				const data = (await res.json()) as {
					status: string;
					code: number;
					error: number;
				};
				expect(data.code).toBe(666);
				expect(data.error).toBe(666);
				expect(data.status).toContain("*.napp9.com");
			} finally {
				process.env.DEBUG = originalDebug;
			}
		});

		test("allows signup request from localhost when DEBUG=true", async () => {
			const originalDebug = process.env.DEBUG;
			process.env.DEBUG = "true";
			try {
				const uniqueName = `debug_user_${Date.now()}`;
				const req = new Request("http://localhost/signup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Host: "localhost",
						Origin: "http://localhost",
					},
					body: JSON.stringify({ hi: uniqueName, secret: "pass123!" }),
				});
				const res = await route(req);
				expect(res.status).toBe(200);
				const data = (await res.json()) as Record<string, unknown>;
				expect(typeof data.id).toBe("number");
				expect(Number(data.id)).toBeGreaterThanOrEqual(0);
			} finally {
				process.env.DEBUG = originalDebug;
			}
		});

		test("rejects non-POST request method on *.napp9.com domain", async () => {
			const req = new Request("https://app.napp9.com/signup", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("How can I make an acount without postage?");
			expect(data.id).toBe(0);
		});

		test("rejects request with invalid or missing body fields", async () => {
			const req = new Request("https://app.napp9.com/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: "incomplete_user" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("are you an idiot?");
			expect(data.id).toBe(0);
		});

		test("creates a new user successfully", async () => {
			const uniqueName = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
			const req = new Request("https://app.napp9.com/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: uniqueName, secret: "password123!" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("spontaniously materialised");
			expect(typeof data.id).toBe("number");
			expect(Number(data.id)).toBeGreaterThanOrEqual(0);
			expect(typeof data.random).toBe("string");
			expect(String(data.random).length).toBeGreaterThan(0);
		});

		test("prevents creating user with duplicate username", async () => {
			const dupName = `dupuser_${Date.now()}`;
			const createReq1 = new Request("https://app.napp9.com/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: dupName, secret: "secret1" }),
			});
			await route(createReq1);

			const createReq2 = new Request("https://app.napp9.com/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: dupName, secret: "secret2" }),
			});
			const res = await route(createReq2);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("convicted of identity theft");
			expect(data.id).toBe(0);
		});
	});

	describe("5. POST /login", () => {
		test("rejects non-POST login request", async () => {
			const req = new Request("http://localhost/login", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("Your killing me.");
			expect(data.token).toBe("none");
		});

		test("rejects request with missing parameters", async () => {
			const req = new Request("http://localhost/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: "some_user" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("are you an idiot?");
			expect(data.token).toBe("none");
		});

		test("rejects non-existent user login", async () => {
			const req = new Request("http://localhost/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: "non_existent_ghost_123", secret: "foo" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("dont try gaslighting reality");
			expect(data.token).toBe("none");
		});

		test("authenticates valid user with correct password and returns token", async () => {
			const username = `loginuser_${Date.now()}`;
			const secret = "correct_secret_pass";

			const createReq = new Request("https://app.napp9.com/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: username, secret: secret }),
			});
			const createRes = await route(createReq);
			const createData = (await createRes.json()) as Record<string, unknown>;

			const loginReq = new Request("http://localhost/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: username, secret: secret }),
			});
			const loginRes = await route(loginReq);
			expect(loginRes.status).toBe(200);

			const loginData = (await loginRes.json()) as Record<string, unknown>;
			expect(String(loginData.status)).toContain(
				"You remembered your password",
			);
			expect(loginData.token).toBe(createData.random);
		});

		test("rejects valid user with incorrect password", async () => {
			const username = `wrongpassuser_${Date.now()}`;
			const secret = "correct_pass";

			await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: username, secret: secret }),
				}),
			);

			const loginReq = new Request("http://localhost/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: username, secret: "wrong_pass" }),
			});
			const loginRes = await route(loginReq);
			expect(loginRes.status).toBe(200);

			const loginData = (await loginRes.json()) as Record<string, unknown>;
			expect(String(loginData.status)).toContain("forget your password");
			expect(String(loginData.token)).toContain("robber");
		});
	});

	describe("6. POST /found", () => {
		test("rejects non-POST found request", async () => {
			const req = new Request("http://localhost/found", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("I am not a mind reader.");
			expect(data.id).toBe(0);
		});

		test("rejects unauthorized request without valid Auth token", async () => {
			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: "invalid_ghost_token_12345",
				},
				body: JSON.stringify({ name: "Ghost_Corp", type: 0 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data.status).toBe("Sorry, ghosts cant own companies");
			expect(data.id).toBe(0);
		});

		test("rejects request with invalid or non-object body", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_body_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;

			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: "",
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("I need some info");
			expect(data.id).toBe(0);
		});

		test("rejects request with missing or non-string company name", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_noname_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;

			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ type: 0 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("are you thick");
			expect(data.id).toBe(0);
		});

		test("rejects request with whitespace-only company name", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_ws_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;

			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: "   ", type: 0 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("null company");
			expect(data.id).toBe(0);
		});

		test("rejects request with invalid company type", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_badtype_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;

			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: `Corp_${Date.now()}`, type: 999 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("aint got any idea");
			expect(data.id).toBe(0);
		});

		test("rejects founding request when user has insufficient cash", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_broke_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;

			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: `Broke_Corp_${Date.now()}`, type: 0 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("cant afford");
			expect(data.id).toBe(0);
		});

		test("founds a company successfully and allocates 10k shares to creator", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_success_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `Acme_Success_${Date.now()}`;
			const req = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: compName, type: 0 }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data.status)).toContain("OMG, this actually worked!?");
			expect(typeof data.id).toBe("number");
			expect(Number(data.id)).toBeGreaterThan(0);

			const companyId = Number(data.id);
			const shares = await getSharesByOwner(userId, true);
			expect(
				shares.some((s) => s.owned_id === companyId && s.quantity === 10000),
			).toBe(true);
		});

		test("prevents creating company with duplicate name", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_dup_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `Acme_Dup_${Date.now()}`;
			const req1 = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: compName, type: 1 }),
			});
			const res1 = await route(req1);
			expect(res1.status).toBe(200);

			const req2 = new Request("http://localhost/found", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Auth: token,
				},
				body: JSON.stringify({ name: compName, type: 2 }),
			});
			const res2 = await route(req2);
			expect(res2.status).toBe(200);

			const data2 = (await res2.json()) as Record<string, unknown>;
			expect(String(data2.status)).toContain("fraud");
			expect(data2.id).toBe(0);
		});
	});

	describe("7. GET /list/companies", () => {
		test("lists companies and hides private data for unauthenticated callers", async () => {
			const founderName = `ceo_user_${Date.now()}`;
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: founderName, secret: "pass" }),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `Data_Priv_Corp_${Date.now()}`;
			await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: compName, type: 0 }),
				}),
			);

			// Unauthenticated request
			const publicReq = new Request("http://localhost/list/companies", {
				method: "GET",
			});
			const publicRes = await route(publicReq);
			expect(publicRes.status).toBe(200);

			const publicList = (await publicRes.json()) as Array<{
				id: number;
				name: string;
				data?: unknown;
			}>;
			const targetCompanyPublic = publicList.find((c) => c.name === compName);
			expect(targetCompanyPublic).toBeDefined();
			expect(targetCompanyPublic?.data).toBeUndefined();

			// Authenticated as CEO
			const ceoReq = new Request("http://localhost/list/companies", {
				method: "GET",
				headers: { Auth: token },
			});
			const ceoRes = await route(ceoReq);
			expect(ceoRes.status).toBe(200);

			const ceoList = (await ceoRes.json()) as Array<{
				id: number;
				name: string;
				data?: { inventory?: Record<number, number>; facilities?: unknown[] };
			}>;
			const targetCompanyCeo = ceoList.find((c) => c.name === compName);
			expect(targetCompanyCeo).toBeDefined();
			expect(targetCompanyCeo?.data).toBeDefined();
			expect(targetCompanyCeo?.data?.inventory).toBeDefined();
			expect(targetCompanyCeo?.data?.inventory?.[0]).toBe(0);
			expect(targetCompanyCeo?.data?.facilities).toEqual([]);
		});

		test("filters companies by type and sorting", async () => {
			const req = new Request(
				"http://localhost/list/companies?type=0&sortBy=name",
				{
					method: "GET",
				},
			);
			const res = await route(req);
			expect(res.status).toBe(200);

			const list = (await res.json()) as Array<{ type: number; name: string }>;
			for (const c of list) {
				expect(c.type).toBe(0);
			}
		});
	});

	describe("8. GET /company", () => {
		test("retrieves single company by id and name with CEO data protection", async () => {
			const founderName = `single_ceo_${Date.now()}`;
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: founderName, secret: "pass" }),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `Single_Corp_${Date.now()}`;
			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: compName, type: 2 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);

			// Public query by name (no data)
			const pubReq = new Request(
				`http://localhost/company?name=${encodeURIComponent(compName)}`,
				{ method: "GET" },
			);
			const pubRes = await route(pubReq);
			expect(pubRes.status).toBe(200);
			const pubData = (await pubRes.json()) as {
				status: string;
				company: { id: number; data?: unknown };
			};
			expect(pubData.status).toBe("Success");
			expect(pubData.company.id).toBe(compId);
			expect(pubData.company.data).toBeUndefined();

			// CEO query by ID (includes data)
			const ceoReq = new Request(`http://localhost/company?id=${compId}`, {
				method: "GET",
				headers: { Auth: token },
			});
			const ceoRes = await route(ceoReq);
			expect(ceoRes.status).toBe(200);
			const ceoData = (await ceoRes.json()) as {
				status: string;
				company: { id: number; data?: unknown };
			};
			expect(ceoData.status).toBe("Success");
			expect(ceoData.company.data).toBeDefined();

			// Non-existent company
			const notFoundReq = new Request("http://localhost/company?id=99999999", {
				method: "GET",
			});
			const notFoundRes = await route(notFoundReq);
			const notFoundData = (await notFoundRes.json()) as { status: string };
			expect(notFoundData.status).toBe("Company not found");
		});
	});

	describe("9. GET /company/shareholders", () => {
		test("retrieves shareholder distribution for a company", async () => {
			const founderName = `shareholder_ceo_${Date.now()}`;
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: founderName, secret: "pass" }),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `CapTable_Corp_${Date.now()}`;
			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: compName, type: 0 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);

			const capReq = new Request(
				`http://localhost/company/shareholders?id=${compId}`,
				{
					method: "GET",
				},
			);
			const capRes = await route(capReq);
			expect(capRes.status).toBe(200);

			const capData = (await capRes.json()) as {
				status: string;
				company_id: number;
				shares_outstanding: number;
				shareholders: Array<{
					owner_id: number;
					quantity: number;
					percentage: number;
				}>;
			};
			expect(capData.status).toBe("Success");
			expect(capData.company_id).toBe(compId);
			expect(capData.shares_outstanding).toBe(10000);
			expect(capData.shareholders.length).toBeGreaterThan(0);
			expect(capData.shareholders[0]?.owner_id).toBe(userId);
			expect(capData.shareholders[0]?.quantity).toBe(10000);
			expect(capData.shareholders[0]?.percentage).toBe(100);
		});
	});

	describe("10. GET /portfolio", () => {
		test("rejects unauthorized portfolio access", async () => {
			const req = new Request("http://localhost/portfolio", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as { status: string };
			expect(data.status).toBe("Unauthorized");
		});

		test("returns holdings for authenticated user", async () => {
			const username = `port_user_${Date.now()}`;
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: username, secret: "pass" }),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;

			await updateUserCash(userId, 50000);

			const compName = `Port_Corp_${Date.now()}`;
			await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: compName, type: 1 }),
				}),
			);

			const portReq = new Request("http://localhost/portfolio", {
				method: "GET",
				headers: { Auth: token },
			});
			const portRes = await route(portReq);
			expect(portRes.status).toBe(200);

			const portData = (await portRes.json()) as {
				status: string;
				portfolio: Array<{
					company_name: string;
					quantity: number;
					ownership_percentage: number;
				}>;
			};
			expect(portData.status).toBe("Success");
			expect(
				portData.portfolio.some(
					(h) => h.company_name === compName && h.quantity === 10000,
				),
			).toBe(true);
		});
	});

	describe("11. 404 Not Found & Unknown Routes", () => {
		test("returns 404 for undefined paths", async () => {
			const req = new Request("http://localhost/unknown_route_path", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(404);

			const text = await res.text();
			expect(text).toBe("You are utterless and hopelessly lost. Get a GPS.");
		});
	});

	describe("12. Request Headers & Search Parameters", () => {
		test("parses request headers and search params without error", async () => {
			const req = new Request("http://localhost/version?debug=true", {
				method: "GET",
				headers: { Auth: "test_token_123" },
			});
			const res = await route(req);
			expect(res.status).toBe(200);
		});

		test("handles requests without Auth header", async () => {
			const req = new Request("http://localhost/version", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);
		});
	});

	describe("13. OPTIONS Requests & CORS Preflight", () => {
		test("handles OPTIONS preflight for GET routes with 204 status", async () => {
			const req = new Request("http://localhost/list/companies", {
				method: "OPTIONS",
			});
			const res = await route(req);
			expect(res.status).toBe(204);
			expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
			expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
			expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Auth");
		});

		test("handles OPTIONS preflight for POST routes with 204 status", async () => {
			const req = new Request("http://localhost/found", {
				method: "OPTIONS",
			});
			const res = await route(req);
			expect(res.status).toBe(204);
			expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
			expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
		});

		test("handles OPTIONS preflight for /signup: 204 on *.napp9.com, 666 on other domains", async () => {
			// Valid napp9 domain
			const reqAllowed = new Request("https://game.napp9.com/signup", {
				method: "OPTIONS",
				headers: {
					Origin: "https://game.napp9.com",
				},
			});
			const resAllowed = await route(reqAllowed);
			expect(resAllowed.status).toBe(204);
			expect(resAllowed.headers.get("Access-Control-Allow-Origin")).toBe(
				"https://game.napp9.com",
			);
			expect(resAllowed.headers.get("Access-Control-Allow-Methods")).toContain(
				"POST",
			);

			// Disallowed domain
			const reqDisallowed = new Request("https://evil.com/signup", {
				method: "OPTIONS",
				headers: {
					Origin: "https://evil.com",
					Host: "evil.com",
				},
			});
			const resDisallowed = await route(reqDisallowed);
			expect(resDisallowed.status).toBe(403);
			expect(resDisallowed.headers.get("X-Error-Code")).toBe("666");
			const disData = (await resDisallowed.json()) as {
				status: string;
				code: number;
			};
			expect(disData.code).toBe(666);
			expect(disData.status).toContain("*.napp9.com");

			// Localhost preflight allowed when DEBUG=true
			const reqLocalhost = new Request("http://localhost/signup", {
				method: "OPTIONS",
				headers: {
					Origin: "http://localhost",
					Host: "localhost",
				},
			});
			const resLocalhost = await route(reqLocalhost);
			expect(resLocalhost.status).toBe(204);
		});

		test("attaches Access-Control-Allow-Origin to GET/POST responses", async () => {
			const req = new Request("http://localhost/version", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);
			expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
		});
	});

	describe("14. GET /docs (Scalar API Reference)", () => {
		test("serves Scalar HTML when called from localhost", async () => {
			const req = new Request("http://localhost/docs", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);
			const html = await res.text();
			expect(html).toContain("@scalar/api-reference");
			expect(html).toContain("/openapi.json");
		});

		test("rejects remote caller / external proxy with 403 Forbidden", async () => {
			const req = new Request("https://game.server.napp9.com/docs", {
				method: "GET",
				headers: {
					Host: "game.server.napp9.com",
					"cf-connecting-ip": "203.0.113.195",
				},
			});
			const res = await route(req);
			expect(res.status).toBe(403);
			const text = await res.text();
			expect(text).toContain("Forbidden");
		});
	});

	describe("15. POST /facility/buy", () => {
		test("rejects unauthenticated requests", async () => {
			const req = new Request("http://localhost/facility/buy", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ company_id: 1, recipe: "water_pump" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);
			const data = (await res.json()) as { status: string };
			expect(data.status).toContain("ghosts");
		});

		test("rejects when non-CEO attempts to purchase facility", async () => {
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `fac_ceo_${Date.now()}`, secret: "pass" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 10000);

			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Fac_Corp_${Date.now()}`, type: 0 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);

			// Other user tries to buy
			const otherRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `other_${Date.now()}`, secret: "pass" }),
				}),
			);
			const otherData = (await otherRes.json()) as Record<string, unknown>;
			const otherToken = otherData.random as string;

			const buyReq = new Request("http://localhost/facility/buy", {
				method: "POST",
				headers: { "Content-Type": "application/json", Auth: otherToken },
				body: JSON.stringify({ company_id: compId, recipe: "water_pump" }),
			});
			const buyRes = await route(buyReq);
			const buyData = (await buyRes.json()) as { status: string };
			expect(buyData.status).toContain("Only the CEO");
		});

		test("rejects when company is not a Production company", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `store_ceo_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;
			await updateUserCash(userId, 10000);

			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: `WebStore_${Date.now()}`, type: 2 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);
			await updateCompanyCash(compId, 5000);

			const buyReq = new Request("http://localhost/facility/buy", {
				method: "POST",
				headers: { "Content-Type": "application/json", Auth: token },
				body: JSON.stringify({ company_id: compId, recipe: "water_pump" }),
			});
			const buyRes = await route(buyReq);
			const buyData = (await buyRes.json()) as { status: string };
			expect(buyData.status).toContain("Only Production companies");
		});

		test("rejects when company has insufficient cash", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `broke_comp_ceo_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;
			await updateUserCash(userId, 10000);

			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: `Broke_Prod_${Date.now()}`, type: 0 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);
			// Company starts with $0 cash, water_pump costs $200
			const buyReq = new Request("http://localhost/facility/buy", {
				method: "POST",
				headers: { "Content-Type": "application/json", Auth: token },
				body: JSON.stringify({ company_id: compId, recipe: "water_pump" }),
			});
			const buyRes = await route(buyReq);
			const buyData = (await buyRes.json()) as { status: string };
			expect(buyData.status).toContain("Insufficient company funds");
		});

		test("successfully purchases a facility, deducts company cash, and stores facility in data", async () => {
			const userRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `rich_prod_ceo_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData.random as string;
			const userId = userData.id as number;
			await updateUserCash(userId, 10000);

			const compName = `Rich_Prod_${Date.now()}`;
			const foundRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: token },
					body: JSON.stringify({ name: compName, type: 0 }),
				}),
			);
			const foundData = (await foundRes.json()) as Record<string, unknown>;
			const compId = Number(foundData.id);

			// Fund company treasury with $5000
			await updateCompanyCash(compId, 5000);

			// Buy geothermal_plant (cost $500)
			const buyReq = new Request("http://localhost/facility/buy", {
				method: "POST",
				headers: { "Content-Type": "application/json", Auth: token },
				body: JSON.stringify({
					company_id: compId,
					recipe: "geothermal_plant",
					name: "Primary Thermal Unit",
				}),
			});
			const buyRes = await route(buyReq);
			expect(buyRes.status).toBe(200);
			const buyData = (await buyRes.json()) as {
				status: string;
				facility_id: string;
				cost: number;
				balance: number;
			};
			expect(buyData.status).toBe("Success");
			expect(buyData.cost).toBe(500);
			expect(buyData.balance).toBe(4500);
			expect(buyData.facility_id).toBeDefined();

			// CEO checks company profile
			const compReq = new Request(`http://localhost/company?id=${compId}`, {
				method: "GET",
				headers: { Auth: token },
			});
			const compRes = await route(compReq);
			const compDetails = (await compRes.json()) as {
				status: string;
				company: {
					cash: number;
					data: {
						facilities: Array<{
							id: string;
							name: string;
							recipe: { name: string; outputQuant: number };
						}>;
					};
				};
			};
			expect(compDetails.company.cash).toBe(4500);
			expect(compDetails.company.data.facilities.length).toBe(1);
			expect(compDetails.company.data.facilities[0]?.name).toBe(
				"Primary Thermal Unit",
			);
			expect(compDetails.company.data.facilities[0]?.recipe.name).toBe(
				"Geothermal Power Plant",
			);
		});
	});

	describe("16. Market HTTP Endpoints (/market/depth, /market/buy, /market/sell, /market/cancel)", () => {
		test("GET /market/depth returns orderbook depth for a resource", async () => {
			const req = new Request("http://localhost/market/depth?resource=1", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);
			const data = (await res.json()) as {
				status: string;
				resource: number;
				orders: unknown[];
				offers: unknown[];
			};
			expect(data.status).toBe("Success");
			expect(data.resource).toBe(1);
			expect(Array.isArray(data.orders)).toBe(true);
			expect(Array.isArray(data.offers)).toBe(true);
		});

		test("POST /market/buy and POST /market/sell execute trades with CEO auth and cancel orders", async () => {
			// Create CEO 1 & Company 1 (Seller)
			const sUserRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `mkt_seller_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const sUserData = (await sUserRes.json()) as Record<string, unknown>;
			const sToken = sUserData.random as string;
			const sUserId = sUserData.id as number;
			await updateUserCash(sUserId, 10000);

			const sCompRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: sToken },
					body: JSON.stringify({
						name: `Mkt_Seller_Co_${Date.now()}`,
						type: 0,
					}),
				}),
			);
			const sCompData = (await sCompRes.json()) as Record<string, unknown>;
			const sCompId = Number(sCompData.id);
			await addCompanyResource(sCompId, 1, 100); // 100 units of Water (resource: 1)

			// Create CEO 2 & Company 2 (Buyer)
			const bUserRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `mkt_buyer_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const bUserData = (await bUserRes.json()) as Record<string, unknown>;
			const bToken = bUserData.random as string;
			const bUserId = bUserData.id as number;
			await updateUserCash(bUserId, 10000);

			const bCompRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: bToken },
					body: JSON.stringify({
						name: `Mkt_Buyer_Co_${Date.now()}`,
						type: 0,
					}),
				}),
			);
			const bCompData = (await bCompRes.json()) as Record<string, unknown>;
			const bCompId = Number(bCompData.id);
			await updateCompanyCash(bCompId, 5000);

			// Non-CEO attempt to sell -> Rejected
			const badSell = await route(
				new Request("http://localhost/market/sell", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: bToken }, // wrong CEO
					body: JSON.stringify({
						company_id: sCompId,
						resource: 1,
						quantity: 50,
						unitPrice: 2.5,
					}),
				}),
			);
			const badSellData = (await badSell.json()) as { status: string };
			expect(badSellData.status).toContain("Only the CEO");

			// Seller places sell offer: 50 units @ $2.50
			const sellRes = await route(
				new Request("http://localhost/market/sell", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: sToken },
					body: JSON.stringify({
						company_id: sCompId,
						resource: 1,
						quantity: 50,
						unitPrice: 2.5,
					}),
				}),
			);
			const sellData = (await sellRes.json()) as {
				status: string;
				resting_offer_id?: number;
			};
			expect(sellData.status).toBe("Success");
			expect(sellData.resting_offer_id).toBeDefined();

			// Buyer buys 20 units @ max $3.00 -> Fills 20 units @ $2.50
			const buyRes = await route(
				new Request("http://localhost/market/buy", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: bToken },
					body: JSON.stringify({
						company_id: bCompId,
						resource: 1,
						quantity: 20,
						unitPrice: 3.0,
					}),
				}),
			);
			const buyData = (await buyRes.json()) as {
				status: string;
				filled_quantity: number;
				remaining_quantity: number;
			};
			expect(buyData.status).toBe("Success");
			expect(buyData.filled_quantity).toBe(20);
			expect(buyData.remaining_quantity).toBe(0);

			// Seller cancels remaining resting offer (30 units)
			const cancelRes = await route(
				new Request("http://localhost/market/cancel", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: sToken },
					body: JSON.stringify({
						company_id: sCompId,
						offer_id: sellData.resting_offer_id,
					}),
				}),
			);
			const cancelData = (await cancelRes.json()) as {
				status: string;
				refunded_resource_qty: number;
			};
			await deleteCompanyById(sCompId);
			await deleteCompanyById(bCompId);
			await deleteUserById(sUserId);
			await deleteUserById(bUserId);
		});
	});

	describe("17. Company Worker Shifts & Production Execution (/company/wage, /company/work)", () => {
		test("CEO sets company wage, rejected for non-CEO", async () => {
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `wage_ceo_${Date.now()}`, secret: "p" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 5000);

			const compRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Wage_Co_${Date.now()}`, type: 0 }),
				}),
			);
			const compData = (await compRes.json()) as Record<string, unknown>;
			const compId = Number(compData.id);

			// Other user tries to set wage -> Rejected
			const badWage = await route(
				new Request("http://localhost/company/wage", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: "ghost_token" },
					body: JSON.stringify({ company_id: compId, wage: 25 }),
				}),
			);
			const badWageData = (await badWage.json()) as { status: string };
			expect(badWageData.status).toContain("Only the CEO");

			// CEO sets wage to $35
			const setWage = await route(
				new Request("http://localhost/company/wage", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: compId, wage: 35 }),
				}),
			);
			const setWageData = (await setWage.json()) as {
				status: string;
				wage: number;
			};
			expect(setWageData.status).toBe("Success");
			expect(setWageData.wage).toBe(35);

			await deleteCompanyById(compId);
			await deleteUserById(ceoId);
		});

		test("Worker performs shift, receives wage, triggers random production, mapped in workers/worked, rejects duplicate work same day", async () => {
			// Create CEO & Company with Geothermal Facility
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `fac_ceo_${Date.now()}`, secret: "p" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 10000);

			const compRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Fac_Co_${Date.now()}`, type: 0 }),
				}),
			);
			const compId = Number(
				((await compRes.json()) as Record<string, unknown>).id,
			);
			await updateCompanyCash(compId, 5000);

			// Buy Water Pump facility (cost $200)
			const buyFacRes = await route(
				new Request("http://localhost/facility/buy", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({
						company_id: compId,
						recipe: "water_pump",
					}),
				}),
			);
			expect(buyFacRes.status).toBe(200);

			// Set wage to $20
			await route(
				new Request("http://localhost/company/wage", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: compId, wage: 20 }),
				}),
			);

			// Create Worker Player
			const workerRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `worker_${Date.now()}`, secret: "p" }),
				}),
			);
			const workerData = (await workerRes.json()) as Record<string, unknown>;
			const workerToken = workerData.random as string;
			const workerId = workerData.id as number;
			await updateUserCash(workerId, 0); // Start with $0

			// Worker performs work
			const workRes = await route(
				new Request("http://localhost/company/work", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: workerToken },
					body: JSON.stringify({ company_id: compId }),
				}),
			);
			const workResult = (await workRes.json()) as {
				status: string;
				wage_paid: number;
				company_cash: number;
				user_cash: number;
				production: { facility: string; output: number; quantity: number };
			};
			expect(workResult.status).toBe("Success");
			expect(workResult.wage_paid).toBe(20);
			expect(workResult.user_cash).toBe(20);
			expect(workResult.company_cash).toBe(4780); // 5000 - 200 (facility) - 20 (wage)
			expect(workResult.production.output).toBe(1); // Water
			expect(workResult.production.quantity).toBe(500);

			// Worker tries to work again at same company today -> Rejected
			const dupWork = await route(
				new Request("http://localhost/company/work", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: workerToken },
					body: JSON.stringify({ company_id: compId }),
				}),
			);
			const dupWorkData = (await dupWork.json()) as { status: string };
			expect(dupWorkData.status).toContain("already worked at this company");

			// Verify mapped arrays in company.data: workers has workerId, worked has true
			const compProfile = await route(
				new Request(`http://localhost/company?id=${compId}`, {
					method: "GET",
					headers: { Auth: ceoToken },
				}),
			);
			const compInfo = (await compProfile.json()) as {
				company: {
					data: {
						workers: number[];
						worked: boolean[];
						inventory: Record<number, number>;
					};
				};
			};
			expect(compInfo.company.data.workers).toContain(workerId);
			const workerIdx = compInfo.company.data.workers.indexOf(workerId);
			expect(compInfo.company.data.worked[workerIdx]).toBe(true);
			expect(compInfo.company.data.inventory[1]).toBe(500); // 500 water

			await deleteCompanyById(compId);
			await deleteUserById(ceoId);
			await deleteUserById(workerId);
		});
	});

	describe("18. Capital Management & Roster Resignation (/company/deposit, /company/dividend, /company/fire, /company/quit)", () => {
		test("Player deposits funds into company treasury", async () => {
			const uRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `dep_user_${Date.now()}`, secret: "p" }),
				}),
			);
			const uData = (await uRes.json()) as Record<string, unknown>;
			const uToken = uData.random as string;
			const uId = uData.id as number;
			await updateUserCash(uId, 3000);

			const cRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: uToken },
					body: JSON.stringify({ name: `Dep_Co_${Date.now()}`, type: 0 }),
				}),
			);
			const cId = Number(((await cRes.json()) as Record<string, unknown>).id);

			// Deposit $750 into company treasury
			const depRes = await route(
				new Request("http://localhost/company/deposit", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: uToken },
					body: JSON.stringify({ company_id: cId, amount: 750 }),
				}),
			);
			const depData = (await depRes.json()) as {
				status: string;
				deposited: number;
				user_cash: number;
				company_cash: number;
			};
			expect(depData.status).toBe("Success");
			expect(depData.deposited).toBe(750);
			expect(depData.user_cash).toBe(1750); // 3000 - 500 (founding) - 750 (deposit) = 1750
			expect(depData.company_cash).toBe(750);

			await deleteCompanyById(cId);
			await deleteUserById(uId);
		});

		test("CEO distributes dividend pro-rata to shareholders, non-CEO rejected", async () => {
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `div_ceo_${Date.now()}`, secret: "p" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 5000);

			const cRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Div_Co_${Date.now()}`, type: 0 }),
				}),
			);
			const cId = Number(((await cRes.json()) as Record<string, unknown>).id);
			await updateCompanyCash(cId, 2000);

			// Non-CEO tries to distribute dividend -> Rejected
			const badDiv = await route(
				new Request("http://localhost/company/dividend", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: "fake_token" },
					body: JSON.stringify({ company_id: cId, amount: 500 }),
				}),
			);
			const badDivData = (await badDiv.json()) as { status: string };
			expect(badDivData.status).toContain("Only the CEO");

			// CEO distributes $1000 dividend (CEO + company treasury = 2 shareholders)
			const divRes = await route(
				new Request("http://localhost/company/dividend", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: cId, amount: 1000 }),
				}),
			);
			const divData = (await divRes.json()) as {
				status: string;
				dividend_distributed: number;
				remaining_cash: number;
				shareholders_paid: number;
			};
			expect(divData.status).toBe("Success");
			expect(divData.dividend_distributed).toBe(1000);
			expect(divData.remaining_cash).toBe(1000);
			expect(divData.shareholders_paid).toBe(1);

			await deleteCompanyById(cId);
			await deleteUserById(ceoId);
		});

		test("CEO fires worker and Worker quits company", async () => {
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `fire_ceo_${Date.now()}`, secret: "p" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 5000);

			const cRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Fire_Co_${Date.now()}`, type: 0 }),
				}),
			);
			const cId = Number(((await cRes.json()) as Record<string, unknown>).id);
			await updateCompanyCash(cId, 2000);

			// Create Worker 1 and Worker 2
			const w1Res = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `w1_${Date.now()}`, secret: "p" }),
				}),
			);
			const w1Data = (await w1Res.json()) as Record<string, unknown>;
			const w1Token = w1Data.random as string;
			const w1Id = w1Data.id as number;

			const w2Res = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `w2_${Date.now()}`, secret: "p" }),
				}),
			);
			const w2Data = (await w2Res.json()) as Record<string, unknown>;
			const w2Token = w2Data.random as string;
			const w2Id = w2Data.id as number;

			// Both workers report for work
			await route(
				new Request("http://localhost/company/work", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: w1Token },
					body: JSON.stringify({ company_id: cId }),
				}),
			);
			await route(
				new Request("http://localhost/company/work", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: w2Token },
					body: JSON.stringify({ company_id: cId }),
				}),
			);

			// CEO fires worker 1
			const fireRes = await route(
				new Request("http://localhost/company/fire", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: cId, worker_id: w1Id }),
				}),
			);
			const fireData = (await fireRes.json()) as {
				status: string;
				fired_worker_id: number;
			};
			expect(fireData.status).toBe("Success");
			expect(fireData.fired_worker_id).toBe(w1Id);

			// Worker 2 quits company
			const quitRes = await route(
				new Request("http://localhost/company/quit", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: w2Token },
					body: JSON.stringify({ company_id: cId }),
				}),
			);
			const quitData = (await quitRes.json()) as {
				status: string;
				quit_company_id: number;
			};
			expect(quitData.status).toBe("Success");
			expect(quitData.quit_company_id).toBe(cId);

			// Verify company worker roster is now empty
			const compProfile = await route(
				new Request(`http://localhost/company?id=${cId}`, {
					method: "GET",
					headers: { Auth: ceoToken },
				}),
			);
			const compInfo = (await compProfile.json()) as {
				company: {
					data: { workers: number[]; worked: boolean[] };
				};
			};
			expect(compInfo.company.data.workers).toEqual([]);
			expect(compInfo.company.data.worked).toEqual([]);

			await deleteCompanyById(cId);
			await deleteUserById(ceoId);
			await deleteUserById(w1Id);
			await deleteUserById(w2Id);
		});
	});

	describe("19. WebStore Operations & Server NPC Consumer Sink (/store/price, /store/buy)", () => {
		test("WebStore retail pricing and player food purchase with electricity operating overhead", async () => {
			// Create CEO and found WebStore (Type 1, cost $750)
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `store_ceo_${Date.now()}`, secret: "p" }),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 5000);

			const storeRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `Store_Co_${Date.now()}`, type: 2 }),
				}),
			);
			const storeData = (await storeRes.json()) as Record<string, unknown>;
			const storeId = Number(storeData.id);

			// CEO sets Food price to $18
			const priceRes = await route(
				new Request("http://localhost/store/price", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: storeId, price: 18 }),
				}),
			);
			const priceData = (await priceRes.json()) as {
				status: string;
				price: number;
			};
			expect(priceData.status).toBe("Success");
			expect(priceData.price).toBe(18);

			// Stock store with 50 Food and 100 Electricity
			await addCompanyResource(storeId, Resources.Food, 50);
			await addCompanyResource(storeId, Resources.Electricity, 100);

			// Create Customer Player
			const custRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `cust_${Date.now()}`, secret: "p" }),
				}),
			);
			const custData = (await custRes.json()) as Record<string, unknown>;
			const custToken = custData.random as string;
			const custId = custData.id as number;
			await updateUserCash(custId, 500);

			// Customer buys 5 Food units
			// Cost = 5 * $18 = $90
			// Electricity used = 10 (base) + 5 = 15
			const buyRes = await route(
				new Request("http://localhost/store/buy", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: custToken },
					body: JSON.stringify({ company_id: storeId, quantity: 5 }),
				}),
			);
			const buyResult = (await buyRes.json()) as {
				status: string;
				quantity: number;
				price: number;
				total_cost: number;
				electricity_used: number;
				buyer_cash: number;
				store_cash: number;
			};
			expect(buyResult.status).toBe("Success");
			expect(buyResult.quantity).toBe(5);
			expect(buyResult.price).toBe(18);
			expect(buyResult.total_cost).toBe(90);
			expect(buyResult.electricity_used).toBe(15);
			expect(buyResult.buyer_cash).toBe(410); // 500 - 90
			expect(buyResult.store_cash).toBe(90);

			// Verify store inventory: 45 Food (50 - 5), 85 Electricity (100 - 15)
			const profileRes = await route(
				new Request(`http://localhost/company?id=${storeId}`, {
					method: "GET",
					headers: { Auth: ceoToken },
				}),
			);
			const profileInfo = (await profileRes.json()) as {
				company: {
					data: { inventory: Record<number, number> };
				};
			};
			expect(profileInfo.company.data.inventory[Resources.Food]).toBe(45);
			expect(profileInfo.company.data.inventory[Resources.Electricity]).toBe(
				85,
			);

			await deleteCompanyById(storeId);
			await deleteUserById(ceoId);
			await deleteUserById(custId);
		});

		test("rejects client-triggered /store/tick (non-client triggerable, 404)", async () => {
			const tickReq = new Request("http://localhost/store/tick", {
				method: "POST",
			});
			const tickRes = await route(tickReq);
			expect(tickRes.status).toBe(404);
		});

		test("Server ticker simulates NPC consumer purchase from cheapest WebStore", async () => {
			const ceoRes = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `npc_ceo_${Date.now()}`,
						secret: "p",
					}),
				}),
			);
			const ceoData = (await ceoRes.json()) as Record<string, unknown>;
			const ceoToken = ceoData.random as string;
			const ceoId = ceoData.id as number;
			await updateUserCash(ceoId, 5000);

			const storeRes = await route(
				new Request("http://localhost/found", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ name: `NpcStore_${Date.now()}`, type: 2 }),
				}),
			);
			const storeId = Number(
				((await storeRes.json()) as Record<string, unknown>).id,
			);

			// Set Food price to $10
			await route(
				new Request("http://localhost/store/price", {
					method: "POST",
					headers: { "Content-Type": "application/json", Auth: ceoToken },
					body: JSON.stringify({ company_id: storeId, price: 10 }),
				}),
			);

			// Stock store with 100 Food and 200 Electricity
			await addCompanyResource(storeId, Resources.Food, 100);
			await addCompanyResource(storeId, Resources.Electricity, 200);

			// Run server-side tick directly
			const tickData = await runServerTick();
			expect(tickData?.purchased).toBe(true);
			expect(tickData?.store_id).toBe(storeId);
			expect(tickData?.quantity).toBeGreaterThanOrEqual(1);
			expect(tickData?.quantity).toBeLessThanOrEqual(50);
			expect(tickData?.electricity_used).toBe(10 + (tickData?.quantity ?? 0));
			expect(tickData?.revenue).toBe((tickData?.quantity ?? 0) * 10);

			await deleteCompanyById(storeId);
			await deleteUserById(ceoId);
		});
	});

	describe("20. Cash Injection & Admin Minting (/cash/inject)", () => {
		test("allows UID 0 to inject arbitrary cash into own account, another user, or company", async () => {
			// Ensure UID 0 exists
			const u0Res = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `admin_root_${Date.now()}`,
						secret: "rootpass",
					}),
				}),
			);
			const u0Data = (await u0Res.json()) as Record<string, unknown>;
			let u0Token = u0Data.random as string;
			let u0Id = u0Data.id as number;

			// If u0Id is not 0 (due to existing test data), manually ensure user 0 exists
			if (u0Id !== 0) {
				const existingU0 = await route(
					new Request("http://localhost/login", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ hi: `admin_root_${Date.now()}`, secret: "pass" }),
					}),
				);
			}

			// Create a secondary regular user
			const u1Res = await route(
				new Request("https://app.napp9.com/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `regular_user_${Date.now()}`,
						secret: "regpass",
					}),
				}),
			);
			const u1Data = (await u1Res.json()) as Record<string, unknown>;
			const u1Token = u1Data.random as string;
			const u1Id = u1Data.id as number;

			// Reject non-UID 0 caller
			const forbiddenRes = await route(
				new Request("http://localhost/cash/inject", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Auth: u1Token,
					},
					body: JSON.stringify({ amount: 100000 }),
				}),
			);
			const forbiddenData = (await forbiddenRes.json()) as { status: string };
			expect(forbiddenData.status).toContain("Forbidden");

			// UID 0 self-injection
			// Create session for user 0
			const { createSession } = await import("../src/sessions/create.ts");
			const rootToken = await createSession(0);

			const injectSelfRes = await route(
				new Request("http://localhost/cash/inject", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Auth: rootToken,
					},
					body: JSON.stringify({ amount: 500000 }),
				}),
			);
			const injectSelfData = (await injectSelfRes.json()) as {
				status: string;
				injected: number;
				user_id: number;
				user_cash: number;
			};
			expect(injectSelfData.status).toBe("Success");
			expect(injectSelfData.injected).toBe(500000);
			expect(injectSelfData.user_id).toBe(0);
			expect(injectSelfData.user_cash).toBeGreaterThanOrEqual(500000);

			// UID 0 injects into regular user
			const injectUserRes = await route(
				new Request("http://localhost/cash/inject", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Auth: rootToken,
					},
					body: JSON.stringify({ amount: 250000, user_id: u1Id }),
				}),
			);
			const injectUserData = (await injectUserRes.json()) as {
				status: string;
				injected: number;
				user_id: number;
				user_cash: number;
			};
			expect(injectUserData.status).toBe("Success");
			expect(injectUserData.injected).toBe(250000);
			expect(injectUserData.user_id).toBe(u1Id);
			expect(injectUserData.user_cash).toBeGreaterThanOrEqual(250000);

			// Clean up
			await deleteUserById(u1Id);
			if (u0Id !== 0) await deleteUserById(u0Id);
		});
	});
});
