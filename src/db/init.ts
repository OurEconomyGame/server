import { CozoDb } from "cozo-node";
import { mkdirSync, existsSync } from "node:fs";

1. Ensure directory exists for RocksDB storage
const DB_DIR = "./main.db";

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

2. Initialize CozoDb with RocksDB
Format: new CozoDb("rocksdb", path_to_directory)
export const db = new CozoDb("rocksdb", DB_DIR);

export interface CozoQueryResult<T = Record<string, unknown>> {
  ok: boolean;
  headers: string[];
  rows: Array<Array<unknown>>;
}

/**
 * Helper to run Datalog queries and return clean JS objects.
 *
 * @param datalog - The Datalog query string.
 * @param params - Optional parameter mapping for the query.
 * @returns A promise that resolves to an array of parsed results.
 */
export async function query<T = Record<string, unknown>>(
  datalog: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const result = (await db.run(datalog, params)) as CozoQueryResult<T>;

  if (!result.ok) {
    throw new Error(`Cozo Query Error`);
  }

  const { headers, rows } = result;

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj as T;
  });
}

/**
 * Initialize relations with a placeholder schema.
 */
export async function initDb(): Promise<void> {
  console.log(`[DB] Initializing CozoDB with RocksDB engine at: ${DB_DIR}`);

  try {
    await db.run(`
      :create user {
        id: Int
        =>
        name: String,
        pass_hash: String,
        email: String,
        last_accessed: Int,
        data: Data,
        created_at: Int
      }
    `);
    console.log("[DB] Schema initialized successfully.");
  } catch (err: unknown) {
    if (String(err).includes("already exists")) {
      console.log("[DB] RocksDB schema loaded from disk.");
    } else {
      console.error("[DB] Failed to initialize schema:", err);
      throw err;
    }
  }
}
