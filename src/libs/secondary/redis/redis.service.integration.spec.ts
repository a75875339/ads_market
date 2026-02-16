import {Test, TestingModule} from '@nestjs/testing'
import type {StartedTestContainer} from 'testcontainers'
import {GenericContainer} from 'testcontainers'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {Duration, sleep} from '../../domain/index.js'
import type {IRedisModuleOptions} from '../../redis/index.js'
import {getRedisUrl} from '../../redis/index.js'
import {CONFIG_INJECTOR, LOGGER_INJECTOR} from '../../redis/nest.js'
import {RedisModule} from './redis.module.js'
import {RedisStorageService} from './redis.service.js'

describe('RedisStorageService', () => {
  let redis: StartedTestContainer
  let service: RedisStorageService
  let module: TestingModule

  beforeAll(async () => {
    redis = await new GenericContainer('redis').withExposedPorts(6379).start()
    const redisConfig = {
      host: redis.getHost(),
      port: redis.getMappedPort(6379),
      username: '',
      password: '',
      db: 0,
      tls: false,
    }

    module = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(LOGGER_INJECTOR)
      .useValue({
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      })
      .overrideProvider(CONFIG_INJECTOR)
      .useValue({
        cache_url: getRedisUrl(redisConfig!),
        queue_url: getRedisUrl(redisConfig!),
      } as IRedisModuleOptions)
      .compile()

    await module.init()

    service = module.get<RedisStorageService>(RedisStorageService)
  })

  afterAll(async () => {
    await module?.close()
    await redis?.stop()
  })

  describe('inRedlock', () => {
    it('should skip lock in silent if lock already acquired', async () => {
      const lockKey = 'test:1'
      let start = false
      await service.inRedlock(lockKey, async () => {
        await service.inRedlock(
          lockKey,
          async () => {
            start = true

            throw new Error('never happen')
          },
          {silent: true, retryCount: 0},
        )
      })

      expect(start).toBeFalsy()
    })

    it('should not lock and throw error if key is already acquired', async () => {
      const lockKey = 'test:lol'
      let start = false
      let myError = false
      await service.inRedlock(lockKey, async () => {
        try {
          await service.inRedlock(
            lockKey,
            async () => {
              start = true
            },
            {retryCount: 0},
          )
        } catch (error: any) {
          myError = true
          expect(error.message).toMatch(
            /Failed to acquire lock for key: test:lol/,
          )
        }
      })

      expect(myError).toBeTruthy()
      expect(start).toBeFalsy()
    })

    it('should throw error with silent true', async () => {
      const lockKey = 'test'

      await expect(
        service.inRedlock(
          lockKey,
          async () => {
            throw new Error('im possible error')
          },
          {silent: true},
        ),
      ).rejects.toThrow(/im possible error/)
    })
  })

  it('should work ok if the lockTtl expired', async () => {
    const lockKey = 'test'
    let start = false
    await service.inRedlock(
      lockKey,
      async () => {
        await sleep(Duration.fromMilliseconds(200))

        start = true
      },
      {lockTtl: Duration.fromMilliseconds(100)},
    )

    expect(start).toBeTruthy()
  })
})
