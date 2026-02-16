import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {
  CampaignStatus,
  DealActorType,
  DealEventType,
  DealStatus,
} from '../../../db/constants.js'
import {
  type CampaignInsert,
  CampaignRepository,
} from '../../../db/repositories/campaign.repository.js'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {DealEventRepository} from '../../../db/repositories/deal-event.repository.js'
import {inTransaction} from '../../../db/utils.js'
import type {
  CreateCampaignBody,
  UpdateCampaignBody,
} from './campaign.schemas.js'

@Injectable()
export class CampaignService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly campaignRepository: CampaignRepository,
    private readonly dealRepository: DealRepository,
    private readonly dealEventRepository: DealEventRepository,
  ) {
    this.logger.setContext(CampaignService.name)
  }

  async list(advertiserId: bigint, status?: CampaignStatus) {
    return this.campaignRepository.listByAdvertiser(advertiserId, status)
  }

  async get(campaignId: bigint) {
    return this.campaignRepository.findById(campaignId)
  }

  async create(advertiserId: bigint, body: CreateCampaignBody) {
    return this.campaignRepository.create({
      advertiserId,
      ...body,
    } as CampaignInsert)
  }

  async update(
    campaignId: bigint,
    advertiserId: bigint,
    body: UpdateCampaignBody,
  ) {
    const campaign = await this.campaignRepository.findById(
      campaignId,
      advertiserId,
    )
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    return this.campaignRepository.update(campaignId, advertiserId, body)
  }

  async sendToArchive(campaignId: bigint, advertiserId: bigint) {
    const campaign = await this.campaignRepository.findById(
      campaignId,
      advertiserId,
    )
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    if (campaign.status === CampaignStatus.ARCHIVED) {
      throw new BadRequestException('Campaign is already archived')
    }

    // Check for unfinished paid deals
    const unfinishedDeals =
      await this.dealRepository.findUnfinishedByCampaign(campaignId)

    for (const deal of unfinishedDeals) {
      if (deal.deal_events) {
        throw new BadRequestException(
          'Cannot archive campaign: there are unfinished paid deals',
        )
      }
    }

    // Cancel all remaining unfinished deals and archive campaign in a transaction
    const dealIds = unfinishedDeals.map((d) => d.deals.id)

    const updatedCampaign = await inTransaction(
      this.campaignRepository.db,
      async (tx) => {
        await this.dealRepository.updateStatus(
          dealIds,
          DealStatus.CANCELLED,
          tx,
        )
        await this.dealEventRepository.createMany(
          dealIds.map((id) => ({
            dealId: id,
            eventType: DealEventType.CANCELLED,
            actorType: DealActorType.ADVERTISER,
            metadata: {reason: 'Campaign archived'},
          })),
          tx,
        )

        return this.campaignRepository.updateStatus(
          campaignId,
          CampaignStatus.ARCHIVED,
          tx,
        )
      },
    )

    return updatedCampaign
  }
}
