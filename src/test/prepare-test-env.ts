// import {BullModule} from '@nestjs/bullmq'

import cookie from '@fastify/cookie'
import type {DynamicModule, INestApplication, Type} from '@nestjs/common'
import {FastifyAdapter} from '@nestjs/platform-fastify'
import {Test, type TestingModule} from '@nestjs/testing'
import {drizzle} from 'drizzle-orm/node-postgres'
import {LoggerModule} from 'nestjs-pino'
import pactum from 'pactum'
import pg from 'pg'
import type {StartedTestContainer} from 'testcontainers'
import {GenericContainer} from 'testcontainers'
import {getLoggerOptions} from '../libs/common/logger.js'
import {DB_TOKEN} from '../db/db.tokens.js'
import {relations} from '../db/relations.js'
import type {IRedisModuleOptions} from '../libs/redis/index.js'
import {getRedisUrl} from '../libs/redis/index.js'
import {CONFIG_INJECTOR} from '../libs/redis/modules/index.js'
import {getTestAppPort, getTestDbUrl} from './test-options.js'
import '../patch.js'

type Input = {
  withRedis: boolean
  withHttpServer: boolean
  imports: Array<Type<any>> | DynamicModule[]
  providerOverrides?: Array<{key: Type<any>; value: Type<any>}>
  providers?: Array<Type<any>>
  withBullMq?: boolean
  withWrapInTransaction?: boolean
}

export class TestEnvironment {
  private pool!: pg.Pool
  private compiledTestingModule!: TestingModule
  private app!: INestApplication
  private redis!: StartedTestContainer

  private input: Input

  constructor(input: Input) {
    this.input = input
    this.init = this.init.bind(this)
    this.dispose = this.dispose.bind(this)
    this.beforeFn = this.beforeFn.bind(this)
    this.afterFn = this.afterFn.bind(this)
    this.getService = this.getService.bind(this)
  }

  async init(): Promise<void> {
    const connectionString = getTestDbUrl()

    this.pool = new pg.Pool({connectionString})

    const db = drizzle({
      client: this.pool,
      casing: 'snake_case',
      relations,
    })

    const imports = [
      LoggerModule.forRoot({
        pinoHttp: getLoggerOptions(),
      }),
      ...this.input.imports,
    ]

    let redisConfig = null

    if (this.input.withRedis) {
      this.redis = await new GenericContainer('redis')
        .withExposedPorts(6379)
        .start()
      redisConfig = {
        host: this.redis.getHost(),
        port: this.redis.getMappedPort(6379),
        username: '',
        password: '',
        db: 0,
        tls: false,
      }
    }

    const testingModule = Test.createTestingModule({
      imports,
      providers: this.input.providers,
    })
      .overrideProvider(DB_TOKEN)
      .useValue(db)

    if (this.input.withRedis) {
      testingModule.overrideProvider(CONFIG_INJECTOR).useValue({
        cache_url: getRedisUrl(redisConfig!),
        queue_url: getRedisUrl(redisConfig!),
      } as IRedisModuleOptions)
    }

    if (this.input.providerOverrides) {
      for (const override of this.input.providerOverrides) {
        testingModule.overrideProvider(override.key).useClass(override.value)
      }
    }

    this.compiledTestingModule = await testingModule.compile()

    if (this.input.withHttpServer) {
      this.app = this.compiledTestingModule.createNestApplication(
        new FastifyAdapter(),
      )

      await this.app.getHttpAdapter().getInstance().register(cookie)
      await this.app.listen(getTestAppPort())
      const url = await this.app.getUrl()
      pactum.request.setBaseUrl(url.replace('[::1]', 'localhost'))
    }
  }

  async dispose(): Promise<void> {
    // Close only one — app wraps the testing module, so app.close()
    // already triggers onApplicationShutdown on all providers.
    if (this.input.withHttpServer) {
      await this.app.close()
    } else {
      await this.compiledTestingModule.close()
    }

    await this.pool.end()

    if (this.input.withRedis) {
      await this.redis.stop()
    }
  }

  async beforeFn(): Promise<void> {
    // No-op — each test starts with a clean state after afterFn truncation
  }

  async afterFn(): Promise<void> {
    const client = await this.pool.connect()
    try {
      // Truncate all tables in public schema
      const result = await client.query<{tablename: string}>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      )
      const tableNames = result.rows.map((r) => `"${r.tablename}"`).join(', ')
      if (tableNames.length > 0) {
        await client.query(`TRUNCATE TABLE ${tableNames} CASCADE`)
      }
    } finally {
      client.release()
    }
  }

  getService<T>(service: Type<T>): T {
    return this.compiledTestingModule.get(service)
  }
}
