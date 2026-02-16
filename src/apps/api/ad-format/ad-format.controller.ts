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
import {formatPresets} from '../../../db/format-presets.js'
import type {AdFormatRow} from '../../../db/repositories/ad-format.repository.js'
import {AdFormatRepository} from '../../../db/repositories/ad-format.repository.js'
import {ChannelRepository} from '../../../db/repositories/channel.repository.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {
  ChannelManagerGuard,
  RequireManagerPermissions,
} from '../guards/channel-manager-guard/channel-manager.guard.js'
import {
  CreateAdFormatBodySchema,
  SelectFormatSchema,
  UpdateAdFormatBodySchema,
} from './ad-format.schemas.js'

@Controller('channels')
@UseGuards(AuthGuard)
export class AdFormatsController {
  constructor(
    private readonly adFormatRepository: AdFormatRepository,
    private readonly channelRepository: ChannelRepository,
  ) {}

  private mapAdFormat(row: AdFormatRow) {
    return {
      id: String(row.id),
      channelId: String(row.channelId),
      formatType: row.formatType,
      description: row.description,
      priceUSD: row.priceUSD,
      retentionHours: row.retentionHours,
      topHours: row.topHours,
      isActive: row.isActive,
    }
  }

  @Get(':channelId/ad-formats')
  async list(@Param('channelId') channelIdParam: string) {
    const channelId = IdSchema.parse(channelIdParam)
    const list = await this.adFormatRepository.listByChannelId(channelId)
    return list.map(this.mapAdFormat)
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  @Post(':channelId/ad-formats')
  async create(
    @Param('channelId') channelIdParam: string,
    @Body() body: unknown,
  ) {
    const parsed = CreateAdFormatBodySchema.strict().parse(body)
    const channelId = IdSchema.parse(channelIdParam)
    const preset = formatPresets[parsed.formatType]
    if (!preset) {
      throw new ForbiddenException('Unknown format type')
    }
    const row = await this.adFormatRepository.create({
      channelId,
      formatType: parsed.formatType,
      description: preset.description,
      priceUSD: parsed.priceUSD,
      retentionHours: preset.retentionHours,
      topHours: preset.topHours,
      isActive: true,
    })
    if (!row) {
      throw new NotFoundException('Failed to create ad format')
    }
    return this.mapAdFormat(row)
  }

  @UseGuards(ChannelManagerGuard)
  @RequireManagerPermissions(
    ManagerPermission.MANAGE_FORMATS,
    ManagerPermission.FULL,
  )
  @Post(':channelId/ad-formats/:formatId')
  async update(
    @Param('channelId') channelIdParam: string,
    @Param('formatId') formatIdParam: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateAdFormatBodySchema.strict().parse(body)
    const search = SelectFormatSchema.parse({
      channelId: channelIdParam,
      formatId: formatIdParam,
    })
    const row = await this.adFormatRepository.update(
      search.formatId,
      search.channelId,
      parsed,
    )
    if (!row) {
      throw new NotFoundException('Ad format not found')
    }
    if (parsed.isActive === false) {
      const activeCount = await this.adFormatRepository.countActiveByChannelId(
        search.channelId,
      )
      if (activeCount === 0) {
        await this.channelRepository.updateVisibility(search.channelId, false)
      }
    }
    return this.mapAdFormat(row)
  }

  // @UseGuards(ChannelManagerGuard)
  // @RequireManagerPermissions(
  //   ManagerPermission.MANAGE_FORMATS,
  //   ManagerPermission.FULL,
  // )
  // @Post(':channelId/ad-formats/:formatId/delete')
  // async delete(
  //   @Param('channelId') channelIdParam: string,
  //   @Param('formatId') formatIdParam: string,
  // ) {
  //   const search = SelectFormatSchema.parse({
  //     channelId: channelIdParam,
  //     formatId: formatIdParam,
  //   })
  //   const deleted = await this.adFormatRepository.delete(
  //     search.formatId,
  //     search.channelId,
  //   )
  //   if (!deleted) {
  //     throw new NotFoundException('Ad format not found')
  //   }
  //   return {ok: true}
  // }
}
