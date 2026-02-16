import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {BigDecimal} from '../../../libs/common/bigdecimal.js'
import type {AmountUSD} from '../../../libs/common/types/domain.types.js'
import {config} from '../../../config/config.js'
import {
  CampaignStatus,
  ChannelStatus,
  DealActorType,
  DealEventType,
  DealStatus,
  ManagerPermission,
  TopicRole,
} from '../../../db/constants.js'
import {AdFormatRepository} from '../../../db/repositories/ad-format.repository.js'
import {
  CampaignRepository,
  type CampaignRow,
} from '../../../db/repositories/campaign.repository.js'
import {
  ChannelRepository,
  type ChannelRow,
} from '../../../db/repositories/channel.repository.js'
import {ChannelManagerRepository} from '../../../db/repositories/channel-manager.repository.js'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {DealEventRepository} from '../../../db/repositories/deal-event.repository.js'
import {inTransaction} from '../../../db/utils.js'
import {RedisStorageService} from '../../../libs/secondary/redis/redis.service.js'
import {TonPaymentProcessorService} from '../../../modules/blockchain/ton-payment-processor.service.js'
import {DealTopicPublisherService} from '../../job-worker/jobs/deal-topic/deal-topic-publisher.service.js'
import type {DealTopicJobData} from '../../job-worker/jobs/deal-topic/types.js'
import type {DealGuardResult} from '../guards/deal-guard/deal.guard.js'
import type {
  ConfirmDealBody,
  CreateDealBody,
  UpdateDealParamsBody,
} from './deal.schemas.js'

const NOT_CANCELABLE_STATUSES = new Set([
  DealStatus.POSTED,
  DealStatus.COMPLETED,
  DealStatus.CANCELLED,
]) as Set<DealStatus>

const POSSIBLE_CONFIRM_STATUSES = new Set([
  DealStatus.DRAFT_APPLICATION,
  DealStatus.DRAFT,
  DealStatus.NEGOTIATION,
]) as Set<DealStatus>

const HasDealPermissions = new Set([
  ManagerPermission.MANAGE_DEALS,
  ManagerPermission.FULL,
  ManagerPermission.MANAGE_FORMATS,
]) as Set<ManagerPermission>

@Injectable()
export class DealService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly dealRepository: DealRepository,
    private readonly dealEventRepository: DealEventRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly channelRepository: ChannelRepository,
    private readonly channelManagerRepository: ChannelManagerRepository,
    private readonly adFormatRepository: AdFormatRepository,
    private readonly redis: RedisStorageService,
    private readonly dealTopicPublisher: DealTopicPublisherService,
    private readonly tonPaymentProcessor: TonPaymentProcessorService,
  ) {
    this.logger.setContext(DealService.name)
  }

  async createDeal(creatorId: bigint, body: CreateDealBody) {
    const [channel, campaign, adFormat] = await Promise.all([
      this.channelRepository.findByIdWithRelations(body.channelId, {
        managers: true,
      }),
      this.campaignRepository.findById(body.campaignId),
      this.adFormatRepository.findById(body.adFormatId),
    ])

    if (
      !channel ||
      channel.status !== ChannelStatus.ACTIVE ||
      !campaign ||
      campaign.status !== CampaignStatus.ACTIVE ||
      !adFormat ||
      adFormat.isActive === false ||
      adFormat.channelId !== channel.id
    ) {
      throw new NotFoundException('Channel or campaign or ad format not found')
    }
    const channelManager = channel.managers?.find((m) => m.userId === creatorId)
    let hasPermissions = false
    if (channelManager && HasDealPermissions.has(channelManager.permissions)) {
      hasPermissions = true
    } else if (campaign.advertiserId === creatorId) {
      hasPermissions = true
    }
    if (!hasPermissions) {
      throw new NotFoundException('Channel or campaign not found')
    }

    const isChannelAdmin = channelManager && hasPermissions
    const initialStatus = isChannelAdmin
      ? DealStatus.DRAFT_APPLICATION
      : DealStatus.DRAFT

    const actorType = isChannelAdmin
      ? DealActorType.CHANNEL
      : DealActorType.ADVERTISER

    let adPriceUSD = body.adPriceUSD as AmountUSD | undefined
    if (actorType === DealActorType.ADVERTISER) {
      adPriceUSD = adFormat.priceUSD
    }

    const deal = await inTransaction(this.dealRepository.db, async (tx) => {
      const createdDeal = await this.dealRepository.create(
        {
          creatorId,
          channelId: body.channelId,
          campaignId: body.campaignId,
          adFormatId: body.adFormatId,
          adPriceUSD,
          adScheduleAt: body.adScheduleAt,
          draftDealMessage: body.draftDealMessage,
          status: initialStatus,
        },
        tx,
      )

      if (!createdDeal) {
        throw new BadRequestException('Failed to create deal')
      }

      await this.dealEventRepository.create(
        {
          dealId: createdDeal.id,
          eventType: DealEventType.DRAFT_CONFIRMED,
          actorId: creatorId,
          actorType,
        },
        tx,
      )

      return createdDeal
    })

    await this.publishDealTopicCreation(deal, channel, campaign).catch(
      (err) => {
        this.logger.warn(
          {err, dealId: deal.id.toString()},
          'Failed to create deal topics',
        )
      },
    )

    return deal
  }

  private async publishDealTopicCreation(
    deal: NonNullable<Awaited<ReturnType<DealRepository['create']>>>,
    channel: ChannelRow,
    campaign: CampaignRow,
  ): Promise<void> {
    const managers =
      await this.channelManagerRepository.listActiveWithUserByChannelId(
        channel.id,
      )

    const baseJobData = {
      dealId: deal.id.toString(),
      channelTitle: channel.title,
      campaignTitle: campaign.title,
      draftDealMessage: deal.draftDealMessage,
      adPriceUSD: deal.adPriceUSD,
      adScheduleAt: deal.adScheduleAt?.toISOString() ?? null,
    }

    const jobs: DealTopicJobData[] = managers
      .filter(
        (manager) =>
          HasDealPermissions.has(manager.permissions) &&
          manager.user.id !== campaign.advertiserId,
      )
      .map((manager) => ({
        ...baseJobData,
        userId: manager.user.id.toString(),
        role: TopicRole.CHANNEL_MANAGER,
      }))

    jobs.push({
      ...baseJobData,
      userId: campaign.advertiserId.toString(),
      role: TopicRole.ADVERTISER,
    })

    await this.dealTopicPublisher.publishDealTopicCreationBatch(jobs)
  }

  async listDealsByCampaign(campaignId: bigint, status?: DealStatus) {
    return this.dealRepository.listByCampaign(campaignId, status)
  }

  async listDealsByChannel(channelId: bigint, status?: DealStatus) {
    return this.dealRepository.listByChannel(channelId, status)
  }

  async getDeal(dealId: bigint) {
    return this.dealRepository.findById(dealId)
  }

  async getDealDetails(dealId: bigint) {
    const deal = await this.dealRepository.findByIdWithRelations(dealId, {
      campaign: true,
      channel: true,
      events: true,
      adFormat: true,
    })
    if (!deal) {
      throw new NotFoundException('Deal not found')
    }
    return deal
  }

  async updateDealParams(
    dealId: bigint,
    userId: bigint,
    body: UpdateDealParamsBody,
    access: DealGuardResult,
  ) {
    const dealData = await this.dealRepository.findByIdWithPaidEvents(dealId)

    if (!dealData) {
      throw new NotFoundException('Deal not found')
    }
    if (dealData.deals.status !== DealStatus.NEGOTIATION) {
      throw new BadRequestException('Deal is not in negotiation status')
    }
    if (dealData.deal_events && (body.adPriceUSD || body.adPriceUSD)) {
      throw new BadRequestException(
        'Cannot change price or ad format after deposit received',
      )
    }
    if (access.isCampaignAdmin && body.adPriceUSD) {
      throw new BadRequestException('Cannot change price for channel side')
    }
    let adPriceUSD = body.adPriceUSD as AmountUSD | undefined
    const adFormatId = body.adFormatId ?? dealData.deals.adFormatId
    if (!adFormatId) {
      throw new BadRequestException('Ad format is required')
    }
    const adFormat = await this.adFormatRepository.findById(adFormatId)
    if (
      !adFormat ||
      adFormat.isActive === false ||
      adFormat.channelId !== dealData.deals.channelId
    ) {
      throw new NotFoundException('Ad format not found')
    }

    if (adPriceUSD && new BigDecimal(adPriceUSD).gt(adFormat.priceUSD)) {
      throw new BadRequestException('Price is too big for this ad format')
    } else if (!adPriceUSD) {
      adPriceUSD = adFormat.priceUSD
    }

    const actorType = access.isCampaignAdmin
      ? DealActorType.ADVERTISER
      : DealActorType.CHANNEL
    return this.redis.inRedlock(this.getDealLockKey(dealId), () =>
      inTransaction(this.dealRepository.db, async (tx) => {
        const {adFormatId, adScheduleAt} = body
        const updated = await this.dealRepository.update(
          dealId,
          {
            ...(adPriceUSD ? {adPriceUSD} : {}),
            ...(adFormatId ? {adFormatId} : {}),
            ...(adScheduleAt ? {adScheduleAt} : {}),
          },
          tx,
        )
        if (!updated) {
          throw new NotFoundException('Deal not found')
        }

        await this.dealEventRepository.deleteByDealAndTypeAndActor(
          dealId,
          DealEventType.AD_PARAMETERS_CONFIRMED,
        )

        await this.dealEventRepository.create({
          dealId,
          eventType: DealEventType.CHANGE_AD_PARAMETERS,
          actorId: userId,
          actorType,
          metadata: body,
        })

        return updated
      }),
    )
  }

  async confirmDeal(
    dealId: bigint,
    userId: bigint,
    eventType: ConfirmDealBody['eventType'],
    access: DealGuardResult,
  ) {
    const dealData = await this.dealRepository.findByIdWithPaidEvents(dealId)
    if (!dealData) {
      throw new NotFoundException('Deal not found')
    }
    if (
      eventType === DealEventType.DRAFT_CONFIRMED &&
      dealData.deals.status !== DealStatus.DRAFT_APPLICATION &&
      dealData.deals.status !== DealStatus.DRAFT
    ) {
      throw new BadRequestException('Deal is not in draft status')
    }
    if (
      !POSSIBLE_CONFIRM_STATUSES.has(dealData.deals.status) &&
      (eventType === DealEventType.CREATIVE_CONFIRMED ||
        eventType === DealEventType.AD_PARAMETERS_CONFIRMED)
    ) {
      throw new BadRequestException('Deal is not in negotiation status')
    }
    if (
      eventType === DealEventType.CREATIVE_CONFIRMED &&
      !dealData.deals.creativeData
    ) {
      throw new BadRequestException('Creative data is not set')
    }
    if (
      eventType === DealEventType.AD_PARAMETERS_CONFIRMED &&
      (!dealData.deals.adPriceUSD ||
        !dealData.deals.adFormatId ||
        !dealData.deals.adScheduleAt ||
        new Date(dealData.deals.adScheduleAt).getTime() <= Date.now())
    ) {
      throw new BadRequestException('Ad parameters are not set')
    }

    const actorType = access.isCampaignAdmin
      ? DealActorType.ADVERTISER
      : DealActorType.CHANNEL

    return this.redis.inRedlock(this.getDealLockKey(dealId), async () => {
      const existing = await this.dealEventRepository.findByDealAndTypeAndActor(
        dealId,
        [eventType],
        actorType,
      )
      if (existing.length > 0) {
        throw new BadRequestException('Already confirmed')
      }

      return inTransaction(this.dealRepository.db, async (tx) => {
        await this.dealEventRepository.create(
          {
            dealId,
            eventType,
            actorId: userId,
            actorType,
          },
          tx,
        )

        if (eventType === DealEventType.DRAFT_CONFIRMED) {
          const notActorType =
            actorType === DealActorType.ADVERTISER
              ? DealActorType.CHANNEL
              : DealActorType.ADVERTISER
          const DraftApproves =
            await this.dealEventRepository.findByDealAndTypeAndActor(
              dealId,
              [DealEventType.DRAFT_CONFIRMED],
              notActorType,
              tx,
            )
          if (DraftApproves.length > 0) {
            await this.dealRepository.updateStatus(
              [dealId],
              DealStatus.NEGOTIATION,
              tx,
            )
          }
        } else {
          const NegotiationApproves =
            await this.dealEventRepository.findByDealAndTypeAndActor(
              dealId,
              [
                DealEventType.CREATIVE_CONFIRMED,
                DealEventType.AD_PARAMETERS_CONFIRMED,
                DealEventType.DEPOSIT_RECEIVED,
              ],
              undefined,
              tx,
            )
          if (NegotiationApproves.length >= 5) {
            if (
              dealData.deals.status === DealStatus.NEGOTIATION &&
              dealData.deals.adScheduleAt
            ) {
              await this.dealRepository.updateStatus(
                [dealId],
                DealStatus.SCHEDULED,
                tx,
              )
            }
          }
        }
      })
    })
  }

  async cancelDeal(
    dealId: bigint,
    userId: bigint,
    access: DealGuardResult,
    reason?: string,
  ) {
    const dealData = await this.dealRepository.findByIdWithPaidEvents(dealId)
    if (!dealData) {
      throw new NotFoundException('Deal not found')
    }

    if (
      NOT_CANCELABLE_STATUSES.has(dealData.deals.status) ||
      (access.isCampaignAdmin && dealData.deal_events)
    ) {
      throw new BadRequestException('Deal cannot be cancelled')
    }

    const hasPaidDeposit = !!dealData.deal_events

    const updated = await this.redis.inRedlock(
      this.getDealLockKey(dealId),
      () =>
        inTransaction(this.dealRepository.db, async (tx) => {
          const result = await this.dealRepository.update(
            dealId,
            {
              status: DealStatus.CANCELLED,
              cancelledAt: new Date(),
              cancelledById: userId,
              cancelReason: reason,
            },
            tx,
          )

          await this.dealEventRepository.create(
            {
              dealId,
              eventType: DealEventType.CANCELLED,
              actorId: userId,
              actorType: access.isCampaignAdmin
                ? DealActorType.ADVERTISER
                : DealActorType.CHANNEL,
              metadata: reason ? {reason} : undefined,
            },
            tx,
          )

          return result
        }),
    )

    // Create pending refund if deal had a deposit
    if (hasPaidDeposit) {
      await this.tonPaymentProcessor.createPendingRefund(dealId)
    }

    return updated
  }

  private getDealLockKey(dealId: bigint) {
    return `${config.cache_redis.keys.deal_update_lock.key}:${dealId}`
  }
}
