import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// ANSI Color Escape Codes
const ANSI_RED = "\x1b[31m";
const ANSI_BLUE = "\x1b[34m";
const ANSI_RESET = "\x1b[0m";

export interface ColorizedLine {
	lineNumber: number;
	commitHash: string;
	isAi: boolean;
	content: string;
	coloredText: string;
}

/**
 * Parses git blame output and classifies each line as AI (- AI) or Human authored.
 *
 * @param filePath - Path to the target file.
 * @returns Array of colorized lines with metadata.
 */
export function getGitAuthorColorizedLines(filePath: string): ColorizedLine[] {
	const absolutePath = resolve(filePath);

	if (!existsSync(absolutePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const gitBlame = spawnSync("git", ["blame", "--porcelain", absolutePath], {
		encoding: "utf-8",
	});

	if (gitBlame.error) {
		throw gitBlame.error;
	}

	if (gitBlame.status !== 0) {
		throw new Error(
			`git blame failed (exit code ${gitBlame.status}): ${gitBlame.stderr}`,
		);
	}

	const lines = gitBlame.stdout.split("\n");
	const commitIsAiMap = new Map<string, boolean>();
	const results: ColorizedLine[] = [];

	let currentCommitHash = "";
	let currentLineNumber = 0;

	for (const rawLine of lines) {
		if (!rawLine) continue;

		// Header line: <40-char-hash> <orig-line-num> <final-line-num> [group-lines]
		const headerMatch = rawLine.match(/^([0-9a-f]{40}|0{40})\s+(\d+)\s+(\d+)/);
		if (headerMatch?.[1] && headerMatch[3]) {
			currentCommitHash = headerMatch[1];
			currentLineNumber = Number.parseInt(headerMatch[3], 10);
			continue;
		}

		// Commit summary header line
		if (rawLine.startsWith("summary ")) {
			const summary = rawLine.substring("summary ".length).trim();
			// Commits ending with " - AI" or containing "- AI" / "-AI"
			const isAi =
				summary.endsWith("- AI") ||
				summary.endsWith("-AI") ||
				summary.includes(" - AI") ||
				summary.includes("-AI");
			commitIsAiMap.set(currentCommitHash, isAi);
			continue;
		}

		// Line content: begins with a tab character '\t'
		if (rawLine.startsWith("\t")) {
			const content = rawLine.substring(1);
			const isAi = commitIsAiMap.get(currentCommitHash) ?? false;
			const colorCode = isAi ? ANSI_RED : ANSI_BLUE;
			const coloredText = `${colorCode}${content}${ANSI_RESET}`;

			results.push({
				lineNumber: currentLineNumber,
				commitHash: currentCommitHash,
				isAi,
				content,
				coloredText,
			});
		}
	}

	return results;
}

/**
 * CLI execution entrypoint when run directly via Node/Bun.
 */
if (import.meta.main || process.argv[1]?.endsWith("blame-color.ts")) {
	const targetFile = process.argv[2];

	if (!targetFile) {
		console.error("Usage: bun tools/blame-color.ts <path-to-file>");
		console.error("       node tools/blame-color.ts <path-to-file>");
		process.exit(1);
	}

	try {
		const colorized = getGitAuthorColorizedLines(targetFile);
		for (const line of colorized) {
			console.log(line.coloredText);
		}
	} catch (err: unknown) {
		console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
		process.exit(1);
	}
}
