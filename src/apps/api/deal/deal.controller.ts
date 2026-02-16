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
import type {DealStatus} from '../../../db/constants.js'
import {ManagerPermission} from '../../../db/constants.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {
  ChannelManagerGuard,
  RequireManagerPermissions,
} from '../guards/channel-manager-guard/channel-manager.guard.js'
import {
  DealAccess,
  DealGuard,
  type DealGuardResult,
} from '../guards/deal-guard/deal.guard.js'
import {MapperHelperService} from '../mapper/mapper-helper.service.js'
import {
  CancelDealBodySchema,
  ConfirmDealBodySchema,
  CreateDealBodySchema,
  ListDealsQuerySchema,
  UpdateDealParamsBodySchema,
} from './deal.schemas.js'
import {DealService} from './deal.service.js'

@Controller('deals')
@UseGuards(AuthGuard)
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  async createDeal(@CurrentUser() user: UserSession, @Body() body: unknown) {
    const parsed = CreateDealBodySchema.strict().parse(body)
    const deal = await this.dealService.createDeal(user.id, parsed)
    return MapperHelperService.mapDeal(deal)
  }

  @Get('campaign/:campaignId')
  async listDealsByCampaign(
    @CurrentUser() _user: UserSession,
    @Param('campaignId') campaignIdParam: string,
    @Query() query: unknown,
  ) {
    const campaignId = IdSchema.parse(campaignIdParam)
    const parsed = ListDealsQuerySchema.parse(query ?? {})
    const deals = await this.dealService.listDealsByCampaign(
      campaignId,
      parsed.status as DealStatus | undefined,
    )
    return deals.map((d) => MapperHelperService.mapDeal(d))
  }

  @Get('channel/:channelId')
  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.VIEW,
    ManagerPermission.MANAGE_DEALS,
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  async listDealsByChannel(
    @Param('channelId') channelIdParam: string,
    @Query() query: unknown,
  ) {
    const channelId = IdSchema.parse(channelIdParam)
    const parsed = ListDealsQuerySchema.parse(query ?? {})
    const deals = await this.dealService.listDealsByChannel(
      channelId,
      parsed.status as DealStatus | undefined,
    )
    return deals.map((d) => MapperHelperService.mapDeal(d))
  }

  @Get(':dealId')
  @UseGuards(DealGuard)
  async getDealDetails(@Param('dealId') dealIdParam: string) {
    const dealId = IdSchema.parse(dealIdParam)
    const deal = await this.dealService.getDealDetails(dealId)
    return MapperHelperService.mapDealWithDetails(deal)
  }

  @Post(':dealId/params')
  @UseGuards(DealGuard)
  async updateDealParams(
    @CurrentUser() user: UserSession,
    @Param('dealId') dealIdParam: string,
    @Body() body: unknown,
    @DealAccess() access: DealGuardResult,
  ) {
    const dealId = IdSchema.parse(dealIdParam)
    const parsed = UpdateDealParamsBodySchema.strict().parse(body)
    const deal = await this.dealService.updateDealParams(
      dealId,
      user.id,
      parsed,
      access,
    )
    if (!deal) {
      throw new NotFoundException('Deal not found')
    }
    return MapperHelperService.mapDeal(deal)
  }

  @Post(':dealId/confirm')
  @UseGuards(DealGuard)
  async confirmDeal(
    @CurrentUser() user: UserSession,
    @Param('dealId') dealIdParam: string,
    @Body() body: unknown,
    @DealAccess() access: DealGuardResult,
  ) {
    const dealId = IdSchema.parse(dealIdParam)
    const parsed = ConfirmDealBodySchema.strict().parse(body)
    await this.dealService.confirmDeal(
      dealId,
      user.id,
      parsed.eventType,
      access,
    )
    const deal = await this.dealService.getDeal(dealId)
    if (!deal) {
      throw new NotFoundException('Deal not found')
    }
    return MapperHelperService.mapDeal(deal)
  }

  @Post(':dealId/cancel')
  @UseGuards(DealGuard)
  async cancelDeal(
    @CurrentUser() user: UserSession,
    @Param('dealId') dealIdParam: string,
    @Body() body: unknown,
    @DealAccess() access: DealGuardResult,
  ) {
    const dealId = IdSchema.parse(dealIdParam)
    const parsed = CancelDealBodySchema.parse(body ?? {})
    const deal = await this.dealService.cancelDeal(
      dealId,
      user.id,
      access,
      parsed.reason,
    )
    if (!deal) {
      throw new NotFoundException('Deal not found')
    }
    return MapperHelperService.mapDeal(deal)
  }
}
