import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {Address} from '@ton/core'
import {CurrentUser} from '../../../libs/common/current-user.js'
import {IdSchema} from '../../../libs/common/schemas/common-schemas.js'
import type {WalletAddress} from '../../../libs/common/types/domain.types.js'
import type {UserSession} from '../../../libs/common/types/user-session.types.js'
import {ChannelStatus, ManagerPermission} from '../../../db/constants.js'
import {CampaignRepository} from '../../../db/repositories/campaign.repository.js'
import {ChannelRepository} from '../../../db/repositories/channel.repository.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {
  ChannelManagerGuard,
  RequireManagerPermissions,
} from '../guards/channel-manager-guard/channel-manager.guard.js'
import {MapperHelperService} from '../mapper/mapper-helper.service.js'
import {
  SearchCampaignsForChannelSchema,
  UpdateCategoryBodySchema,
  UpdateVisibilityBodySchema,
  UpdateWalletBodySchema,
} from './channel.schemas.js'

@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelController {
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  @Get()
  async list(@CurrentUser() user: UserSession) {
    const channels = await this.channelRepository.findByUserId(user.id)
    return channels.map((c) => MapperHelperService.mapChannel(c.channels))
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.VIEW,
    ManagerPermission.MANAGE_DEALS,
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  @Get(':channelId')
  async getById(@Param('channelId') channelIdParam: string) {
    const channelId = IdSchema.parse(channelIdParam)
    const channel = await this.channelRepository.findByIdWithRelations(
      channelId,
      {adFormats: true, stats: true, category: true},
    )
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }
    return MapperHelperService.mapChannel(channel)
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(ManagerPermission.FULL)
  @Post(':channelId/wallet')
  async updateWallet(
    @CurrentUser() user: UserSession,
    @Param('channelId') channelIdParam: string,
    @Body() body: unknown,
  ) {
    const channelId = IdSchema.parse(channelIdParam)
    const parsed = UpdateWalletBodySchema.strict().parse(body)

    const channel = await this.channelRepository.findById(channelId)
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }
    if (channel.ownerId !== user.id) {
      throw new ForbiddenException(
        'Only the channel owner can change the wallet address',
      )
    }

    let tonAddress: Address
    try {
      tonAddress = Address.parse(parsed.walletAddress)
    } catch {
      throw new BadRequestException('Invalid TON wallet address')
    }

    const formattedAddress = tonAddress.toString({
      bounceable: false,
      urlSafe: true,
      testOnly: false,
    }) as WalletAddress

    const updated = await this.channelRepository.updateWalletAddress(
      channelId,
      formattedAddress,
    )
    if (!updated) {
      throw new BadRequestException('Failed to update wallet address')
    }

    return {walletAddress: updated.rewardWalletAddress}
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  @Post(':channelId/category')
  async updateCategory(
    @Param('channelId') channelIdParam: string,
    @Body() body: unknown,
  ) {
    const channelId = IdSchema.parse(channelIdParam)
    const parsed = UpdateCategoryBodySchema.strict().parse(body)

    const channel = await this.channelRepository.findById(channelId)
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }

    const updated = await this.channelRepository.updateCategory(
      channelId,
      parsed.categoryId,
    )
    if (!updated) {
      throw new BadRequestException('Failed to update category')
    }

    return {categoryId: updated.categoryId ? Number(updated.categoryId) : null}
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  @Post(':channelId/visibility')
  async updateVisibility(
    @Param('channelId') channelIdParam: string,
    @Body() body: unknown,
  ) {
    const channelId = IdSchema.parse(channelIdParam)
    const parsed = UpdateVisibilityBodySchema.strict().parse(body)

    const channel = await this.channelRepository.findByIdWithRelations(
      channelId,
      {adFormats: true},
    )
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }

    if (parsed.isVisible) {
      if (!channel.rewardWalletAddress) {
        throw new BadRequestException(
          'Cannot make channel visible: reward wallet address is not set',
        )
      }
      if (channel.status !== ChannelStatus.ACTIVE) {
        throw new BadRequestException(
          'Cannot make channel visible: channel status must be active',
        )
      }
      const activeFormats = channel.adFormats?.filter((f) => f.isActive) ?? []
      if (activeFormats.length === 0) {
        throw new BadRequestException(
          'Cannot make channel visible: at least one active ad format is required',
        )
      }
    }

    const updated = await this.channelRepository.updateVisibility(
      channelId,
      parsed.isVisible,
    )
    if (!updated) {
      throw new BadRequestException('Failed to update visibility')
    }

    return {isVisible: updated.isVisible}
  }

  @Get(':channelId/search/campaigns')
  async searchCampaignsForChannel(
    @Param('channelId') channelIdParam: string,
    @Query() query: unknown,
  ) {
    const channelId = IdSchema.parse(channelIdParam)
    const parsed = SearchCampaignsForChannelSchema.strict().parse(query ?? {})

    const channel = await this.channelRepository.findByIdWithRelations(
      channelId,
      {
        adFormats: true,
        stats: true,
        category: true,
      },
    )
    if (!channel) {
      throw new NotFoundException('Channel not found')
    }

    const results = await this.campaignRepository.searchForChannel(
      {
        subscribers: channel.stats?.subscribers ?? 0,
        avgViews: channel.stats?.avgViews ?? 0,
        categoryId: channel.categoryId ?? undefined,
        adFormats: channel.adFormats!,
      },
      parsed.limit ?? 20,
      parsed.offset ?? 0,
    )

    return results
  }
}
