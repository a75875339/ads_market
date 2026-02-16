import {type ColumnType, sql} from 'drizzle-orm'
import {
  check,
  ExtraConfigColumn,
  type PgColumnBaseConfig,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {DBType, DbOrTransaction} from './db.tokens.js'

export const timestamps = {
  updatedAt: timestamp().$onUpdate(() => new Date()),
  createdAt: timestamp().defaultNow().notNull(),
}

/**
 * Run callback inside a database transaction.
 * If `db` is already a transaction context, reuses it (no nested savepoint).
 */
export async function inTransaction<T>(
  db: DbOrTransaction,
  callback: (tx: DbOrTransaction) => Promise<T>,
): Promise<T> {
  // Drizzle transaction objects expose a rollback method; regular db instances do not
  if ('rollback' in db) {
    return callback(db)
  }
  return (db as DBType).transaction(async (tx) => callback(tx))
}

/**
 * Helper to create a check constraint that validates a column against a set of allowed values
 * @param columnName - The name of the constraint (typically `${columnName}_check`)
 * @param column - The column reference from the table
 * @param allowedValues - Object with allowed values (e.g., KeypairType)
 * @returns A check constraint for use in pgTable
 */
export function createEnumCheckConstraint<T extends string>(
  constraintName: string,
  column: ExtraConfigColumn<PgColumnBaseConfig<ColumnType>>,
  allowedValues: Record<string, T>,
) {
  const values = Object.values(allowedValues)
    .map((v) => `'${v}'`)
    .join(', ')
  return check(constraintName, sql`${column} IN (${sql.raw(values)})`)
}
