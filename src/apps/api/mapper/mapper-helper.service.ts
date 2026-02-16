import {DealActorType, DealEventType} from '../../../db/constants.js'
import type {AdFormatRow} from '../../../db/repositories/ad-format.repository.js'
import type {CampaignRow} from '../../../db/repositories/campaign.repository.js'
import type {ChannelRow} from '../../../db/repositories/channel.repository.js'
import type {DealRow} from '../../../db/repositories/deal.repository.js'
import type {DealEventRow} from '../../../db/repositories/deal-event.repository.js'

type DealWithDetails = DealRow & {
  adFormat?: AdFormatRow | null
  channel?: ChannelRow | null
  campaign?: CampaignRow | null
  events?: DealEventRow[]
}

export class MapperHelperService {
  static mapDeal(row: DealRow) {
    return {
      id: String(row.id),
      channelId: String(row.channelId),
      campaignId: row.campaignId ? String(row.campaignId) : null,
      creatorId: String(row.creatorId),
      status: row.status,
      adFormatId: row.adFormatId ? String(row.adFormatId) : null,
      adPriceUSD: row.adPriceUSD,
      adScheduleAt: row.adScheduleAt,
      draftDealMessage: row.draftDealMessage,
      postedAt: row.postedAt,
      completedAt: row.completedAt,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  static mapDealWithDetails(deal: DealWithDetails) {
    const events = deal.events ?? []

    const hasEvent = (eventType: DealEventType, actorType: DealActorType) =>
      events.some((e) => e.eventType === eventType && e.actorType === actorType)

    return {
      id: String(deal.id),
      status: deal.status,
      channelId: String(deal.channelId),
      campaignId: deal.campaignId ? String(deal.campaignId) : null,
      creatorId: String(deal.creatorId),
      draftDealMessage: deal.draftDealMessage,

      adFormatId: deal.adFormatId ? String(deal.adFormatId) : null,
      adPriceUSD: deal.adPriceUSD,
      adScheduleAt: deal.adScheduleAt,

      draftConfirmed: {
        advertiser: hasEvent(
          DealEventType.DRAFT_CONFIRMED,
          DealActorType.ADVERTISER,
        ),
        channel: hasEvent(DealEventType.DRAFT_CONFIRMED, DealActorType.CHANNEL),
      },
      adParamsConfirmed: {
        advertiser: hasEvent(
          DealEventType.AD_PARAMETERS_CONFIRMED,
          DealActorType.ADVERTISER,
        ),
        channel: hasEvent(
          DealEventType.AD_PARAMETERS_CONFIRMED,
          DealActorType.CHANNEL,
        ),
      },
      creativeConfirmed: {
        advertiser: hasEvent(
          DealEventType.CREATIVE_CONFIRMED,
          DealActorType.ADVERTISER,
        ),
        channel: hasEvent(
          DealEventType.CREATIVE_CONFIRMED,
          DealActorType.CHANNEL,
        ),
      },
      isPaid: events.some(
        (e) => e.eventType === DealEventType.DEPOSIT_RECEIVED,
      ),
      depositReceivedAt:
        events.find((e) => e.eventType === DealEventType.DEPOSIT_RECEIVED)
          ?.createdAt ?? null,

      creativeData: deal.creativeData,
      postedAt: deal.postedAt,
      postedMessageId: deal.postedMessageId
        ? String(deal.postedMessageId)
        : null,
      completedAt: deal.completedAt,
      cancelledAt: deal.cancelledAt,
      cancelReason: deal.cancelReason,

      adFormat: deal.adFormat
        ? {
            id: String(deal.adFormat.id),
            formatType: deal.adFormat.formatType,
            priceUSD: deal.adFormat.priceUSD,
            retentionHours: deal.adFormat.retentionHours,
            topHours: deal.adFormat.topHours,
          }
        : null,

      channel: deal.channel
        ? {
            id: String(deal.channel.id),
            title: deal.channel.title,
            username: deal.channel.username,
          }
        : null,

      campaign: deal.campaign
        ? {
            id: String(deal.campaign.id),
            title: deal.campaign.title,
          }
        : null,

      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    }
  }

  static mapChannel(row: ChannelRow & {adFormats?: AdFormatRow[] | null}) {
    const {adFormats, ...channel} = row
    return {
      ...channel,
      ...(adFormats
        ? {
            adFormats: adFormats.map((f) => ({
              id: String(f.id),
              channelId: String(f.channelId),
              formatType: f.formatType,
              priceUSD: f.priceUSD,
              retentionHours: f.retentionHours,
              topHours: f.topHours,
              isActive: f.isActive,
            })),
          }
        : {}),
    }
  }

  static mapCampaign(row: CampaignRow) {
    return {
      ...row,
    }
  }
}
