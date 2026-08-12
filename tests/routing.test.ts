import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import route from "../src/routing.ts";
import { initDb, cleanupDbOnExit } from "../src/db/init.ts";
import details from "../package.json";

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
			const req = new Request("http://localhost/openapi.json", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["openapi"]).toBe("3.0.3");
			const paths = data["paths"] as Record<string, unknown>;
			expect(paths).toHaveProperty("/version");
			expect(paths).toHaveProperty("/list/users");
			expect(paths).toHaveProperty("/signup");
			expect(paths).toHaveProperty("/login");
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
	});

	describe("4. POST /create/user", () => {
		test("rejects non-POST request method", async () => {
			const req = new Request("http://localhost/signup", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(200);

			const data = (await res.json()) as Record<string, unknown>;
			expect(data["status"]).toBe("INVALID REQUEST");
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
			expect(String(loginData["status"])).toContain("You remembered your password");
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

	describe("6. 404 Not Found & Unknown Routes", () => {
		test("returns 404 for undefined paths", async () => {
			const req = new Request("http://localhost/unknown_route_path", { method: "GET" });
			const res = await route(req);
			expect(res.status).toBe(404);

			const text = await res.text();
			expect(text).toBe("Not Found");
		});
	});

	describe("7. Request Headers, Cookies & Search Parameters", () => {
		test("parses cookie headers without error", async () => {
			const req = new Request("http://localhost/version?debug=true", {
				method: "GET",
				headers: { cookie: "sessionId=xyz123; theme=dark" },
			});
			const res = await route(req);
			expect(res.status).toBe(200);
		});
	});
});
