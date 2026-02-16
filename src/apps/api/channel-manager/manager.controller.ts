import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import {IdSchema} from '../../../libs/common/schemas/common-schemas.js'
import {ManagerPermission} from '../../../db/constants.js'
import {ChannelRepository} from '../../../db/repositories/channel.repository.js'
import {
  type ChannelManagerListItem,
  ChannelManagerRepository,
} from '../../../db/repositories/channel-manager.repository.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {
  ChannelManagerGuard,
  RequireManagerPermissions,
} from '../guards/channel-manager-guard/channel-manager.guard.js'
import {UpdateManagerPermissionBodySchema} from './manager.schemas.js'

@Controller('channels')
@UseGuards(AuthGuard)
export class ManagersController {
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly channelManagerRepository: ChannelManagerRepository,
  ) {}

  private mapManager(row: ChannelManagerListItem) {
    return {
      id: String(row.id),
      permissions: row.permissions,
      user: row.user,
    }
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.FULL,
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.MANAGE_DEALS,
    ManagerPermission.VIEW,
  )
  @Get(':channelId/managers')
  async listManagers(@Param('channelId') channelIdParam: string) {
    const channelId = IdSchema.parse(channelIdParam)
    const channel = await this.channelRepository.findById(channelId)
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }
    const _ownerId = channel.ownerId
    const managers =
      await this.channelManagerRepository.listActiveWithUserByChannelId(
        channelId,
      )
    return managers.map(this.mapManager)
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(ManagerPermission.FULL)
  @Post(':channelId/managers/:userId')
  async updateManagerPermission(
    @Param('channelId') channelIdParam: string,
    @Param('userId') userIdParam: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateManagerPermissionBodySchema.strict().parse(body)
    const channelId = IdSchema.parse(channelIdParam)
    const targetUserId = IdSchema.parse(userIdParam)
    const channel = await this.channelRepository.findById(channelId)
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }
    if (targetUserId === channel.ownerId) {
      throw new ForbiddenException('Owner permission cannot be changed')
    }
    const updatedCount = await this.channelManagerRepository.updatePermissions(
      channelId,
      targetUserId,
      parsed.permissions,
    )
    return {ok: updatedCount > 0}
  }
}
