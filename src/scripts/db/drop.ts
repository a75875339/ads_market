import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/node-postgres'
import {config} from '../../config/config.js'

const db = drizzle({
  connection: {connectionString: config.db.url, ssl: config.db.ssl},
  casing: 'snake_case',
})

const dbDrop = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop production database')
    }

    await db.execute(
      sql`DROP EXTENSION IF EXISTS pg_stat_statements CASCADE; DROP VIEW IF EXISTS pg_stat_statements_info;`,
    )

    // Drop all schemas and recreate public schema
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE;`)
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`)
    await db.execute(sql`CREATE SCHEMA public;`)
    await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres;`)
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`)

    console.log('All tables dropped')
  } catch (error) {
    console.error('Error executing db:drop', error)
  }
}

dbDrop()
