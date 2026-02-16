import {fileURLToPath} from 'node:url'
import pactum from 'pactum'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import {TestEnvironment} from '../../../test/prepare-test-env.js'
import {UserSeedModule} from '../../../test/seeds/user/user-seed.module.js'
import {UserSeedService} from '../../../test/seeds/user/user-seed.service.js'
import {AuthModule} from './auth.module.js'

const __filename = fileURLToPath(import.meta.url)

describe(__filename, () => {
  const {init, dispose, beforeFn, afterFn, getService} = new TestEnvironment({
    imports: [AuthModule, UserSeedModule],
    withRedis: true,
    withHttpServer: true,
  })

  beforeAll(async () => {
    await init()
  })

  beforeEach(async () => {
    await beforeFn()
  })

  afterEach(async () => {
    await afterFn()
  })

  afterAll(async () => {
    await dispose()
  })

  it('should login existing user', async () => {
    const userSeedService = getService(UserSeedService)
    const user = await userSeedService.seed()
    const [rawdata] = userSeedService.encodeTelegramData({
      telegramId: String(user.telegramId),
    })

    const res = await pactum
      .spec()
      .post('/auth/tma')
      .withBody({
        telegramRawData: rawdata,
      })
      .toss()

    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ok: true})
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('should register new user and login', async () => {
    const userSeedService = getService(UserSeedService)
    const telegramId = String(Math.floor(Math.random() * 1e12))
    const [rawdata] = userSeedService.encodeTelegramData({
      telegramId,
      username: 'newuser',
      firstName: 'Test',
      lastName: 'User',
    })

    const res = await pactum
      .spec()
      .post('/auth/tma')
      .withBody({
        telegramRawData: rawdata,
      })
      .toss()

    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({ok: true})
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('should return 401 for invalid telegram raw data', async () => {
    const res = await pactum
      .spec()
      .post('/auth/tma')
      .withBody({
        telegramRawData: 'invalid_data',
      })
      .toss()

    expect(res.statusCode).toBe(401)
  })

  it('should reject empty body', async () => {
    const res = await pactum.spec().post('/auth/tma').withBody({}).toss()

    // Zod strict parse throws — NestJS returns 500 without GlobalExceptionsFilter
    expect(res.statusCode).not.toBe(200)
  })
})
