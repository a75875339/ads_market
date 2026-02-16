import type {CanActivate, ExecutionContext} from '@nestjs/common'
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import type {FastifyRequest} from 'fastify'
import {IdSchema} from '../../../../libs/common/schemas/common-schemas.js'
import type {ManagerPermission as ManagerPermissionType} from '../../../../db/constants.js'
import {ChannelRepository} from '../../../../db/repositories/channel.repository.js'
import {ChannelManagerRepository} from '../../../../db/repositories/channel-manager.repository.js'

export const REQUIRE_MANAGER_PERMISSIONS_KEY = 'requireManagerPermissions'
export const RequireManagerPermissions = (
  ...permissions: ManagerPermissionType[]
) => SetMetadata(REQUIRE_MANAGER_PERMISSIONS_KEY, new Set(permissions))

@Injectable()
export class ChannelManagerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly channelRepository: ChannelRepository,
    private readonly channelManagerRepository: ChannelManagerRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedPermissions = this.reflector.get<Set<ManagerPermissionType>>(
      REQUIRE_MANAGER_PERMISSIONS_KEY,
      context.getHandler(),
    )
    if (!allowedPermissions?.size) {
      throw new ForbiddenException(
        'ChannelManagerGuard requires @RequireManagerPermissions() on the route',
      )
    }

    const req = context.switchToHttp().getRequest<FastifyRequest>()
    const currentUser = req.currentUser
    if (!currentUser) {
      throw new ForbiddenException('Unauthorized')
    }

    const params = req.params as Record<string, string | undefined>
    const channelIdParam = params.channelId
    if (channelIdParam === undefined) {
      throw new ForbiddenException('Channel not found')
    }
    const channelId = IdSchema.parse(channelIdParam)

    const channel = await this.channelRepository.findById(channelId)
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }
    if (channel.ownerId === currentUser.id) {
      return true
    }
    const manager = await this.channelManagerRepository.findByChannelAndUser(
      channelId,
      currentUser.id,
    )
    const allowed =
      manager &&
      allowedPermissions.has(manager.permissions as ManagerPermissionType)
    if (!allowed) {
      throw new ForbiddenException('Not allowed for this channel')
    }
    return true
  }
}
