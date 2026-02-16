import type {NodePgClient} from 'drizzle-orm/node-postgres'
import {drizzle} from 'drizzle-orm/node-postgres'
import {relations} from './relations.js'
import * as schema from './schema.js'

export const DB_TOKEN = Symbol('DB_TOKEN')
export type DBType = ReturnType<
  typeof drizzle<typeof schema, typeof relations, NodePgClient>
>

export type DrizzleTransaction = Parameters<
  Parameters<DBType['transaction']>[0]
>[0]
export type DbOrTransaction = DBType | DrizzleTransaction
