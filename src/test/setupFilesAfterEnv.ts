import {execSync} from 'node:child_process'
import type {StartedPostgreSqlContainer} from '@testcontainers/postgresql'
import {PostgreSqlContainer} from '@testcontainers/postgresql'
import {afterAll, beforeAll} from 'vitest'

let container: StartedPostgreSqlContainer

const startUpTimeout = 120_000

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('testdb')
    .withUsername('postgres')
    .withPassword('postgres')
    .withStartupTimeout(startUpTimeout)
    .start()

  const connectionString = container.getConnectionUri()

  process.env.TEST_DB_URL = connectionString

  // Push schema to test database using drizzle-kit
  execSync(`DB_URL="${connectionString}" npx drizzle-kit push --force`, {
    stdio: 'inherit',
    env: {...process.env, DB_URL: connectionString},
  })
}, startUpTimeout)

afterAll(async () => {
  await container?.stop()
})
