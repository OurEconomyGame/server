import { describe, expect, test } from "bun:test";
import { getGitAuthorColorizedLines } from "../tools/blame-color.ts";

describe("Git Author Blame Colorizer", () => {
	test("colorizes file lines based on git commit history", () => {
		const lines = getGitAuthorColorizedLines("package.json");
		expect(lines.length).toBeGreaterThan(0);

		for (const line of lines) {
			expect(line.lineNumber).toBeGreaterThan(0);
			expect(line.commitHash).toHaveLength(40);
			expect(typeof line.isAi).toBe("boolean");
			expect(line.coloredText).toContain(line.content);

			if (line.isAi) {
				// ANSI Red: \x1b[31m
				expect(line.coloredText.startsWith("\x1b[31m")).toBe(true);
			} else {
				// ANSI Blue: \x1b[34m
				expect(line.coloredText.startsWith("\x1b[34m")).toBe(true);
			}
			expect(line.coloredText.endsWith("\x1b[0m")).toBe(true);
		}
	});

	test("throws error when target file does not exist", () => {
		expect(() => {
			getGitAuthorColorizedLines("non_existent_file_xyz.ts");
		}).toThrow("File not found");
	});
});
