import { createClient, type Client, type InArgs, type ResultSet, type Transaction } from "@libsql/client";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { join } from "node:path";

type QueryRow = Record<string, unknown>;

interface QueryResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

interface QueryStatement {
  all(...args: SQLInputValue[]): Promise<QueryRow[]>;
  get(...args: SQLInputValue[]): Promise<QueryRow | undefined>;
  run(...args: SQLInputValue[]): Promise<QueryResult>;
}

export interface ClinicDatabase {
  exec(sql: string): Promise<void>;
  prepare(sql: string): QueryStatement;
  close(): void;
}

const localDatabasePath = join(process.cwd(), "prisma", "clinic-os.db");
let sharedRemoteClient: Client | undefined;

function remoteClient(): Client | undefined {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url && !authToken) {
    if (process.env.VERCEL) {
      throw new Error("Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.");
    }
    return undefined;
  }
  if (!url || !authToken) {
    throw new Error("Both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.");
  }
  sharedRemoteClient ??= createClient({ url, authToken });
  return sharedRemoteClient;
}

class LocalClinicDatabase implements ClinicDatabase {
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
  }

  async exec(sql: string): Promise<void> {
    const normalized = sql.trim().replace(/;$/, "").toUpperCase();
    if (normalized === "ROLLBACK" && !this.database.isTransaction) return;
    if (normalized === "COMMIT" && !this.database.isTransaction) {
      throw new Error("No database transaction is active.");
    }
    this.database.exec(sql);
  }

  prepare(sql: string): QueryStatement {
    const statement = this.database.prepare(sql);
    return {
      all: async (...args) => statement.all(...args) as QueryRow[],
      get: async (...args) => statement.get(...args) as QueryRow | undefined,
      run: async (...args) => {
        const result = statement.run(...args);
        return { changes: Number(result.changes), lastInsertRowid: result.lastInsertRowid };
      },
    };
  }

  close(): void {
    this.database.close();
  }
}

class RemoteClinicDatabase implements ClinicDatabase {
  private transaction: Transaction | undefined;
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async exec(sql: string): Promise<void> {
    const normalized = sql.trim().replace(/;$/, "").toUpperCase();
    if (normalized === "BEGIN" || normalized === "BEGIN IMMEDIATE" || normalized === "BEGIN TRANSACTION") {
      if (this.transaction) throw new Error("A database transaction is already active.");
      this.transaction = await this.client.transaction("write");
      return;
    }
    if (normalized === "COMMIT") {
      if (!this.transaction) throw new Error("No database transaction is active.");
      const transaction = this.transaction;
      this.transaction = undefined;
      await transaction.commit();
      return;
    }
    if (normalized === "ROLLBACK") {
      if (!this.transaction) return;
      const transaction = this.transaction;
      this.transaction = undefined;
      await transaction.rollback();
      return;
    }
    if (/^PRAGMA\s+/i.test(normalized)) return;
    await this.client.executeMultiple(sql);
  }

  prepare(sql: string): QueryStatement {
    const execute = async (...args: SQLInputValue[]): Promise<ResultSet> => {
      const statement = { sql, args: args as InArgs };
      return this.transaction
        ? this.transaction.execute(statement)
        : this.client.execute(statement);
    };
    return {
      all: async (...args) => (await execute(...args)).rows as QueryRow[],
      get: async (...args) => (await execute(...args)).rows[0] as QueryRow | undefined,
      run: async (...args) => {
        const result = await execute(...args);
        return {
          changes: Number(result.rowsAffected),
          lastInsertRowid: result.lastInsertRowid,
        };
      },
    };
  }

  close(): void {
    if (this.transaction) {
      this.transaction.close();
      this.transaction = undefined;
    }
  }
}

export function isRemoteDatabaseConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN);
}

export async function openClinicDatabase(): Promise<ClinicDatabase> {
  const client = remoteClient();
  if (client) return new RemoteClinicDatabase(client);
  return new LocalClinicDatabase(new DatabaseSync(localDatabasePath));
}
