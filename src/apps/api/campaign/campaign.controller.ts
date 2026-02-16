import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {CurrentUser} from '../../../libs/common/current-user.js'
import {IdSchema} from '../../../libs/common/schemas/common-schemas.js'
import type {UserSession} from '../../../libs/common/types/user-session.types.js'
import type {CampaignStatus} from '../../../db/constants.js'
import {ChannelRepository} from '../../../db/repositories/channel.repository.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {CampaignAdminGuard} from '../guards/campaign-admin-guard/campaign-admin.guard.js'
import {MapperHelperService} from '../mapper/mapper-helper.service.js'
import {
  CreateCampaignBodySchema,
  ListCampaignsQuerySchema,
  SearchChannelsQuerySchema,
  UpdateCampaignBodySchema,
} from './campaign.schemas.js'
import {CampaignService} from './campaign.service.js'

@Controller('campaigns')
@UseGuards(AuthGuard)
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly channelRepository: ChannelRepository,
  ) {}

  @Get()
  async list(@CurrentUser() user: UserSession, @Query() query: unknown) {
    const parsed = ListCampaignsQuerySchema.parse(query ?? {})
    const campaigns = await this.campaignService.list(
      user.id,
      parsed.status as CampaignStatus | undefined,
    )
    return campaigns.map((c) => MapperHelperService.mapCampaign(c))
  }

  @Post()
  async create(@CurrentUser() user: UserSession, @Body() body: unknown) {
    const parsed = CreateCampaignBodySchema.strict().parse(body)
    const campaign = await this.campaignService.create(user.id, parsed)
    if (!campaign) {
      throw new NotFoundException('Failed to create campaign')
    }
    return MapperHelperService.mapCampaign(campaign)
  }

  @UseGuards(CampaignAdminGuard)
  @Get(':campaignId')
  async get(
    @CurrentUser() _user: UserSession,
    @Param('campaignId') campaignIdParam: string,
  ) {
    const campaignId = IdSchema.parse(campaignIdParam)
    const campaign = await this.campaignService.get(campaignId)
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    return MapperHelperService.mapCampaign(campaign)
  }

  @UseGuards(CampaignAdminGuard)
  @Post(':campaignId')
  async update(
    @CurrentUser() user: UserSession,
    @Param('campaignId') campaignIdParam: string,
    @Body() body: unknown,
  ) {
    const campaignId = IdSchema.parse(campaignIdParam)
    const parsed = UpdateCampaignBodySchema.strict().parse(body)
    const campaign = await this.campaignService.update(
      campaignId,
      user.id,
      parsed,
    )
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    return MapperHelperService.mapCampaign(campaign)
  }

  @UseGuards(CampaignAdminGuard)
  @Post(':campaignId/archive')
  async sendToArchive(
    @CurrentUser() user: UserSession,
    @Param('campaignId') campaignIdParam: string,
  ) {
    const campaignId = IdSchema.parse(campaignIdParam)
    const campaign = await this.campaignService.sendToArchive(
      campaignId,
      user.id,
    )
    if (!campaign) {
      throw new NotFoundException('Campaign not found')
    }
    return MapperHelperService.mapCampaign(campaign)
  }

  // Post in case that with get request with very long query
  // can be some problems with url length + heavy query
  @Post('search/channels')
  async searchChannels(@Body() body: unknown) {
    const parsed = SearchChannelsQuerySchema.strict().parse(body)
    const channelIds = await this.channelRepository.search(parsed)
    if (channelIds.length === 0) return {}
    const channelRows = await this.channelRepository.findByIdsWithRelations(
      channelIds,
      {adFormats: true},
    )
    return {
      channels: channelRows.map((c) => MapperHelperService.mapChannel(c)),
      offset: parsed.offset ?? 0 + channelRows.length,
    }
  }
}
