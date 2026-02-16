import {defineRelations} from 'drizzle-orm'
import * as schema from './schema.js'

export const relations = defineRelations(schema, (r) => ({
  users: {
    channels: r.many.channels(),
    managedChannels: r.many.channelManagers({alias: 'managedChannels'}),
    campaigns: r.many.campaign(),
    deals: r.many.deals({alias: 'creator'}),
  },

  categories: {
    channels: r.many.channels(),
  },

  channels: {
    owner: r.one.users({
      from: r.channels.ownerId,
      to: r.users.id,
    }),
    category: r.one.categories({
      from: r.channels.categoryId,
      to: r.categories.id,
    }),
    managers: r.many.channelManagers(),
    stats: r.one.channelStats(),
    adFormats: r.many.adFormats(),
    deals: r.many.deals(),
  },

  channelManagers: {
    channel: r.one.channels({
      from: r.channelManagers.channelId,
      to: r.channels.id,
    }),
    user: r.one.users({
      from: r.channelManagers.userId,
      to: r.users.id,
      alias: 'managedChannels',
    }),
  },

  channelStats: {
    channel: r.one.channels({
      from: r.channelStats.channelId,
      to: r.channels.id,
    }),
  },

  adFormats: {
    channel: r.one.channels({
      from: r.adFormats.channelId,
      to: r.channels.id,
    }),
  },

  campaign: {
    advertiser: r.one.users({
      from: r.campaign.advertiserId,
      to: r.users.id,
    }),
    deals: r.many.deals(),
  },

  deals: {
    channel: r.one.channels({
      from: r.deals.channelId,
      to: r.channels.id,
    }),
    creator: r.one.users({
      from: r.deals.creatorId,
      to: r.users.id,
      alias: 'creator',
    }),
    adFormat: r.one.adFormats({
      from: r.deals.adFormatId,
      to: r.adFormats.id,
    }),
    campaign: r.one.campaign({
      from: r.deals.campaignId,
      to: r.campaign.id,
    }),
    cancelledBy: r.one.users({
      from: r.deals.cancelledById,
      to: r.users.id,
    }),
    messages: r.many.dealMessages(),
    events: r.many.dealEvents(),
    topics: r.many.dealTopics(),
    walletTransactions: r.many.dealWalletTransactions(),
  },

  dealMessages: {
    deal: r.one.deals({
      from: r.dealMessages.dealId,
      to: r.deals.id,
    }),
    sender: r.one.users({
      from: r.dealMessages.senderId,
      to: r.users.id,
    }),
  },

  dealEvents: {
    deal: r.one.deals({
      from: r.dealEvents.dealId,
      to: r.deals.id,
    }),
    actor: r.one.users({
      from: r.dealEvents.actorId,
      to: r.users.id,
    }),
  },

  dealTopics: {
    deal: r.one.deals({
      from: r.dealTopics.dealId,
      to: r.deals.id,
    }),
    user: r.one.users({
      from: r.dealTopics.userId,
      to: r.users.id,
    }),
  },

  dealWalletTransactions: {
    deal: r.one.deals({
      from: r.dealWalletTransactions.dealId,
      to: r.deals.id,
    }),
  },
}))
