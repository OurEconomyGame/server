import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { initDb, cleanupDbOnExit } from "../src/db/init.ts";
import { insertUser, insertSession } from "../src/db/inserts.ts";
import { getAllUsers, getAllSessions, getUserById, getSessionByToken } from "../src/db/gets.ts";
import { updateUserById, updateSessionById } from "../src/db/updates.ts";
import { deleteUserById, deleteSessionById } from "../src/db/deletes.ts";

beforeAll(async () => {
	await initDb();
});

describe("DB CRUD Operations Suite", () => {
	test("User CRUD lifecycle: insert, get, update, getAll, delete", async () => {
		const userId = 5000;
		const inserted = await insertUser(
			userId,
			"test_crud_user",
			"hash123",
			"test@example.com",
			1000,
			{ role: "admin" },
			1000,
		);
		expect(inserted).toBe(true);

		const user = await getUserById(userId);
		expect(user).not.toBeNull();
		expect(user?.name).toBe("test_crud_user");

		const updated = await updateUserById(userId, { name: "updated_crud_user" });
		expect(updated).not.toBeNull();
		expect(updated?.name).toBe("updated_crud_user");

		const allUsers = await getAllUsers();
		expect(allUsers.some((u) => u.id === userId && u.name === "updated_crud_user")).toBe(true);

		const deleted = await deleteUserById(userId);
		expect(deleted).toBe(true);

		const afterDelete = await getUserById(userId);
		expect(afterDelete).toBeNull();
	});

	test("Session CRUD lifecycle: insert, get, update, getAll, delete", async () => {
		const sessionId = 6000;
		const token = "token_crud_6000";
		const inserted = await insertSession(sessionId, 2000, token, 1);
		expect(inserted).toBe(true);

		const session = await getSessionByToken(token);
		expect(session).not.toBeNull();
		expect(session?.id).toBe(sessionId);

		const updated = await updateSessionById(sessionId, { token: "token_crud_updated" });
		expect(updated).not.toBeNull();
		expect(updated?.token).toBe("token_crud_updated");

		const allSessions = await getAllSessions();
		expect(allSessions.some((s) => s.id === sessionId && s.token === "token_crud_updated")).toBe(true);

		const deleted = await deleteSessionById(sessionId);
		expect(deleted).toBe(true);

		const afterDeleteSession = await getSessionByToken("token_crud_updated");
		expect(afterDeleteSession).toBeNull();
	});
});
