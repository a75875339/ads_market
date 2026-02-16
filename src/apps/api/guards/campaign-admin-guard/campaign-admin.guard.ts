import type {CanActivate, ExecutionContext} from '@nestjs/common'
import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common'
import type {FastifyRequest} from 'fastify'
import {IdSchema} from '../../../../libs/common/schemas/common-schemas.js'
import {CampaignRepository} from '../../../../db/repositories/campaign.repository.js'

@Injectable()
export class CampaignAdminGuard implements CanActivate {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>()
    const currentUser = req.currentUser
    if (!currentUser) {
      throw new ForbiddenException('Unauthorized')
    }

    const params = req.params as Record<string, string | undefined>
    const campaignIdParam = params.campaignId
    if (campaignIdParam === undefined) {
      throw new ForbiddenException('Campaign not found')
    }
    const campaignId = IdSchema.parse(campaignIdParam)

    const campaign = await this.campaignRepository.findById(campaignId)
    if (!campaign || campaign.advertiserId !== currentUser.id) {
      throw new NotFoundException('Campaign not found')
    }
    return true
  }
}
