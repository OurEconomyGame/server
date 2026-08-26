import { beforeAll, describe, expect, test } from "bun:test";
import details from "../package.json";
import { getSharesByOwner } from "../src/db/gets.ts";
import { initDb } from "../src/db/init.ts";
import route from "../src/routing.ts";

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
			expect(data["version"]).toBe(details.version);
		});
	});

	describe("2. GET /openapi.json", () => {
		test("serves openapi specification file", async () => {
			const req = new Request("http://localhost/openapi.json", {
				method: "GET",
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["openapi"]).toBe("3.0.3");
			const paths = data["paths"] as Record<string, unknown>;
			expect(paths).toHaveProperty("/version");
			expect(paths).toHaveProperty("/list/users");
			expect(paths).toHaveProperty("/signup");
			expect(paths).toHaveProperty("/login");
			expect(paths).toHaveProperty("/found");
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
			// Ensure at least two users exist with distinct names
			await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ hi: `Zebra_${Date.now()}`, secret: "pass1" }),
				}),
			);
			await route(
				new Request("http://localhost/signup", {
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

	describe("4. POST /create/user", () => {
		test("rejects non-POST request method", async () => {
			const req = new Request("http://localhost/signup", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["status"]).toBe("How can I make an acount without postage?");
			expect(data["id"]).toBe(0);
		});

		test("rejects request with invalid or missing body fields", async () => {
			const req = new Request("http://localhost/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: "incomplete_user" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["status"]).toBe("are you an idiot?");
			expect(data["id"]).toBe(0);
		});

		test("creates a new user successfully", async () => {
			const uniqueName = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
			const req = new Request("http://localhost/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: uniqueName, secret: "password123!" }),
			});
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data["status"])).toContain("spontaniously materialised");
			expect(typeof data["id"]).toBe("number");
			expect(Number(data["id"])).toBeGreaterThan(0);
			expect(typeof data["random"]).toBe("string");
			expect(String(data["random"]).length).toBeGreaterThan(0);
		});

		test("prevents creating user with duplicate username", async () => {
			const dupName = `dupuser_${Date.now()}`;
			const createReq1 = new Request("http://localhost/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: dupName, secret: "secret1" }),
			});
			await route(createReq1);

			const createReq2 = new Request("http://localhost/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hi: dupName, secret: "secret2" }),
			});
			const res = await route(createReq2);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(String(data["status"])).toContain("convicted of identity theft");
			expect(data["id"]).toBe(0);
		});
	});

	describe("5. POST /login", () => {
		test("rejects non-POST login request", async () => {
			const req = new Request("http://localhost/login", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["status"]).toBe("Your killing me.");
			expect(data["token"]).toBe("none");
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
			expect(data["status"]).toBe("are you an idiot?");
			expect(data["token"]).toBe("none");
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
			expect(data["status"]).toBe("dont try gaslighting reality");
			expect(data["token"]).toBe("none");
		});

		test("authenticates valid user with correct password and returns token", async () => {
			const username = `loginuser_${Date.now()}`;
			const secret = "correct_secret_pass";

			const createReq = new Request("http://localhost/signup", {
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
			expect(String(loginData["status"])).toContain(
				"You remembered your password",
			);
			expect(loginData["token"]).toBe(createData["random"]);
		});

		test("rejects valid user with incorrect password", async () => {
			const username = `wrongpassuser_${Date.now()}`;
			const secret = "correct_pass";

			await route(
				new Request("http://localhost/signup", {
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
			expect(String(loginData["status"])).toContain("forget your password");
			expect(String(loginData["token"])).toContain("robber");
		});
	});

	describe("6. POST /found", () => {
		test("rejects non-POST found request", async () => {
			const req = new Request("http://localhost/found", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["status"]).toBe("I am not a mind reader.");
			expect(data["id"]).toBe(0);
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
			expect(data["status"]).toBe("Sorry, ghosts cant own companies");
			expect(data["id"]).toBe(0);
		});

		test("rejects request with invalid or non-object body", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_body_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;

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
			expect(String(data["status"])).toContain("I need some info");
			expect(data["id"]).toBe(0);
		});

		test("rejects request with missing or non-string company name", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_noname_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;

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
			expect(String(data["status"])).toContain("are you thick");
			expect(data["id"]).toBe(0);
		});

		test("rejects request with whitespace-only company name", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_ws_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;

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
			expect(String(data["status"])).toContain("null company");
			expect(data["id"]).toBe(0);
		});

		test("rejects request with invalid company type", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_badtype_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;

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
			expect(String(data["status"])).toContain("aint got any idea");
			expect(data["id"]).toBe(0);
		});

		test("founds a company successfully and allocates 10k shares to creator", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_success_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;
			const userId = userData["id"] as number;

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
			expect(String(data["status"])).toContain("OMG, this actually worked!?");
			expect(typeof data["id"]).toBe("number");
			expect(Number(data["id"])).toBeGreaterThan(0);

			const companyId = Number(data["id"]);
			const shares = await getSharesByOwner(userId, true);
			expect(
				shares.some((s) => s.owned_id === companyId && s.quantity === 10000),
			).toBe(true);
		});

		test("prevents creating company with duplicate name", async () => {
			const userRes = await route(
				new Request("http://localhost/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hi: `founder_dup_${Date.now()}`,
						secret: "pass",
					}),
				}),
			);
			const userData = (await userRes.json()) as Record<string, unknown>;
			const token = userData["random"] as string;

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
			expect(String(data2["status"])).toContain("fraud");
			expect(data2["id"]).toBe(0);
		});
	});

	describe("7. 404 Not Found & Unknown Routes", () => {
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

	describe("8. Request Headers & Search Parameters", () => {
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
});
