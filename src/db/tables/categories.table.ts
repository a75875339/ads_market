import {integer, pgTable, text} from 'drizzle-orm/pg-core'
import {timestamps} from '../utils.js'

export const categories = pgTable('categories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  emoji: text(),
  orderValue: integer().notNull().default(0),
  ...timestamps,
})
