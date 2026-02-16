import type {CanActivate, ExecutionContext} from '@nestjs/common'
import {
  createParamDecorator,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type {FastifyRequest} from 'fastify'
import {IdSchema} from '../../../../libs/common/schemas/common-schemas.js'
import type {ManagerPermission} from '../../../../db/constants.js'
import {ManagerPermission as ManagerPermissionValue} from '../../../../db/constants.js'
import {DealRepository} from '../../../../db/repositories/deal.repository.js'

export type DealGuardResult = {
  canActivate: boolean
  isCampaignAdmin: boolean
  channelAdminPermission: ManagerPermission | null
}

export const DealAccess = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>()
    return request.dealGuardResult
  },
)

@Injectable()
export class DealGuard implements CanActivate {
  constructor(private readonly dealRepository: DealRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>()
    const currentUser = req.currentUser
    if (!currentUser) {
      throw new ForbiddenException('Unauthorized')
    }

    const params = req.params as Record<string, string | undefined>
    const dealIdParam = params.dealId
    if (dealIdParam === undefined) {
      throw new ForbiddenException('Deal not found')
    }
    const dealId = IdSchema.parse(dealIdParam)

    const dealData = await this.dealRepository.findForGuard(
      dealId,
      currentUser.id,
    )
    if (!dealData) {
      throw new NotFoundException('Deal not found')
    }

    let isCampaignAdmin = false
    if (dealData.campaigns?.advertiserId === currentUser.id) {
      isCampaignAdmin = true
    }

    let channelAdminPermission: ManagerPermission | null = null
    if (dealData.channels?.ownerId === currentUser.id) {
      channelAdminPermission = ManagerPermissionValue.FULL
    } else {
      const manager = dealData.channel_managers
      channelAdminPermission = manager?.permissions ?? null
    }

    if (!isCampaignAdmin && !channelAdminPermission) {
      throw new NotFoundException('Deal not found')
    }

    const result: DealGuardResult = {
      canActivate: true,
      isCampaignAdmin,
      channelAdminPermission,
    }

    req.dealGuardResult = result

    return true
  }
}
