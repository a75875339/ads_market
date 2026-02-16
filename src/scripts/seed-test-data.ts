import 'dotenv/config'
import {inArray} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type {AmountUSD, Percent} from '../libs/common/types/domain.types.js'
import {AdFormatType, ChannelStatus, ChannelType} from '../db/constants.js'
import {formatPresets} from '../db/format-presets.js'
import {adFormats} from '../db/tables/ad-formats.table.js'
import {categories} from '../db/tables/categories.table.js'
import {channelStats} from '../db/tables/channel-stats.table.js'
import {channels} from '../db/tables/channels.table.js'
import {users} from '../db/tables/users.table.js'

const DB_URL = process.env.DB_URL
if (!DB_URL) {
  console.error('DB_URL env variable is required')
  process.exit(1)
}

const pool = new pg.Pool({connectionString: DB_URL})
const db = drizzle({client: pool, casing: 'snake_case'})

const CATEGORIES_DATA = [
  {slug: 'crypto', name: 'Crypto & Web3', emoji: '🪙', orderValue: 1},
  {slug: 'tech', name: 'Technology', emoji: '💻', orderValue: 2},
  {slug: 'finance', name: 'Finance & Trading', emoji: '📈', orderValue: 3},
  {slug: 'marketing', name: 'Marketing & SMM', emoji: '📣', orderValue: 4},
  {slug: 'news', name: 'News & Media', emoji: '📰', orderValue: 5},
  {slug: 'education', name: 'Education', emoji: '🎓', orderValue: 6},
  {slug: 'entertainment', name: 'Entertainment', emoji: '🎭', orderValue: 7},
  {slug: 'gaming', name: 'Gaming', emoji: '🎮', orderValue: 8},
  {slug: 'lifestyle', name: 'Lifestyle & Health', emoji: '🧘', orderValue: 9},
  {slug: 'travel', name: 'Travel', emoji: '✈️', orderValue: 10},
] as const

const USERS_DATA = [
  {telegramId: 100001n, firstName: 'Alice', username: 'alice_adv'},
  {telegramId: 100002n, firstName: 'Bob', username: 'bob_owner'},
  {telegramId: 100003n, firstName: 'Charlie', username: 'charlie_owner'},
] as const

async function seed() {
  console.log('Seeding test data...')

  // 1. Categories
  await db
    .insert(categories)
    .values([...CATEGORIES_DATA])
    .onConflictDoNothing({target: categories.slug})
  const allCategories = await db
    .select()
    .from(categories)
    .where(
      inArray(
        categories.slug,
        CATEGORIES_DATA.map((c) => c.slug),
      ),
    )
  console.log(`Categories: ${allCategories.length}`)

  const categoryBySlug = Object.fromEntries(
    allCategories.map((c) => [c.slug, c]),
  )

  // 2. Users
  await db
    .insert(users)
    .values([...USERS_DATA])
    .onConflictDoNothing({target: users.telegramId})
  const allUsers = await db
    .select()
    .from(users)
    .where(
      inArray(
        users.telegramId,
        USERS_DATA.map((u) => u.telegramId),
      ),
    )
  console.log(`Users: ${allUsers.length}`)

  const bob = allUsers.find((u) => u.username === 'bob_owner')
  const charlie = allUsers.find((u) => u.username === 'charlie_owner')
  if (!bob || !charlie) {
    console.error('Could not find seeded users. Exiting.')
    await pool.end()
    return
  }

  // 3. Channels
  const channelsData = [
    {
      telegramChatId: -1001000000001n,
      ownerId: bob.id,
      title: 'CryptoAlpha Daily',
      username: 'cryptoalpha',
      description: 'Daily crypto market analysis and alpha calls',
      channelType: ChannelType.CHANNEL,
      categoryId: categoryBySlug.crypto?.id
        ? BigInt(categoryBySlug.crypto.id)
        : null,
      status: ChannelStatus.ACTIVE,
      botIsAdmin: true,
      isVisible: true,
      language: 'en',
    },
    {
      telegramChatId: -1001000000002n,
      ownerId: bob.id,
      title: 'Tech Insider',
      username: 'techinsider_tg',
      description: 'Breaking tech news and startup reviews',
      channelType: ChannelType.CHANNEL,
      categoryId: categoryBySlug.tech?.id
        ? BigInt(categoryBySlug.tech.id)
        : null,
      status: ChannelStatus.ACTIVE,
      botIsAdmin: true,
      isVisible: true,
      language: 'en',
    },
    {
      telegramChatId: -1001000000003n,
      ownerId: charlie.id,
      title: 'Finance Hub',
      username: 'financehub',
      description: 'Stock market, forex, and personal finance tips',
      channelType: ChannelType.CHANNEL,
      categoryId: categoryBySlug.finance?.id
        ? BigInt(categoryBySlug.finance.id)
        : null,
      status: ChannelStatus.ACTIVE,
      botIsAdmin: true,
      isVisible: true,
      language: 'en',
    },
    {
      telegramChatId: -1001000000004n,
      ownerId: charlie.id,
      title: 'GameZone',
      username: 'gamezone_tg',
      description: 'Gaming news, reviews & esports',
      channelType: ChannelType.CHANNEL,
      categoryId: categoryBySlug.gaming?.id
        ? BigInt(categoryBySlug.gaming.id)
        : null,
      status: ChannelStatus.ACTIVE,
      botIsAdmin: true,
      isVisible: true,
      language: 'en',
    },
    {
      telegramChatId: -1001000000005n,
      ownerId: bob.id,
      title: 'Marketing Secrets',
      username: null,
      description: 'Private channel for marketing professionals',
      channelType: ChannelType.PRIVATE_CHANNEL,
      categoryId: categoryBySlug.marketing?.id
        ? BigInt(categoryBySlug.marketing.id)
        : null,
      status: ChannelStatus.PENDING,
      botIsAdmin: false,
      isVisible: false,
      language: 'en',
    },
  ]

  await db
    .insert(channels)
    .values(channelsData)
    .onConflictDoNothing({target: channels.telegramChatId})
  const insertedChannels = await db
    .select()
    .from(channels)
    .where(
      inArray(
        channels.telegramChatId,
        channelsData.map((c) => c.telegramChatId),
      ),
    )
  console.log(`Channels: ${insertedChannels.length}`)

  // 4. Ad formats for active channels
  const activeChannels = insertedChannels.filter(
    (ch) => ch.status === ChannelStatus.ACTIVE,
  )

  const AD_FORMAT_PRICES: Record<AdFormatType, number> = {
    [AdFormatType.TEST]: 5,
    [AdFormatType.POST_1_24]: 50,
    [AdFormatType.POST_2_48]: 80,
    [AdFormatType.POST_3_72]: 110,
    [AdFormatType.REPOST]: 30,
    [AdFormatType.NO_REMOVAL]: 150,
  }

  const adFormatsData = activeChannels.flatMap((ch) => {
    // Each channel gets 2-4 random format types
    const allTypes = Object.values(AdFormatType)
    const count = 2 + Math.floor(Math.random() * 3)
    const selectedTypes = allTypes
      .sort(() => Math.random() - 0.5)
      .slice(0, count)

    return selectedTypes.map((formatType) => {
      const preset = formatPresets[formatType]
      const basePrice = AD_FORMAT_PRICES[formatType]
      // Add some price variation per channel (0.8x – 1.4x)
      const price = (basePrice * (0.8 + Math.random() * 0.6)).toFixed(2)
      return {
        channelId: ch.id,
        formatType,
        description: preset.description,
        priceUSD: price as AmountUSD,
        retentionHours: preset.retentionHours,
        topHours: preset.topHours,
        isActive: true,
      }
    })
  })

  const insertedAdFormats = await db
    .insert(adFormats)
    .values(adFormatsData)
    .onConflictDoNothing()
    .returning()
  console.log(`Inserted ${insertedAdFormats.length} ad formats`)

  // 5. Channel stats for active channels
  const statsData = activeChannels.map((ch) => ({
    channelId: ch.id,
    subscribers: 5_000 + Math.floor(Math.random() * 95_000),
    avgViews: 1_000 + Math.floor(Math.random() * 19_000),
    avgReach: 800 + Math.floor(Math.random() * 15_000),
    erPercent: (2 + Math.random() * 13).toFixed(2) as Percent,
    source: 'external_service' as const,
  }))

  const insertedStats = await db
    .insert(channelStats)
    .values(statsData)
    .onConflictDoNothing({target: channelStats.channelId})
    .returning()
  console.log(`Inserted ${insertedStats.length} channel stats`)

  console.log('Done!')
  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
