import {Controller, Get, Param, Query, UseGuards} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {CurrentUser} from '../../../libs/common/current-user.js'
import {IdSchema} from '../../../libs/common/schemas/common-schemas.js'
import type {UserSession} from '../../../libs/common/types/user-session.types.js'
import {TonApiService} from '../../../modules/blockchain/ton-api.service.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'
import {DealGuard} from '../guards/deal-guard/deal.guard.js'
import {GetTopupTransactionQuerySchema} from './ton.schemas.js'
import {TonService} from './ton.service.js'

@Controller('ton')
export class TonController {
  constructor(
    private readonly tonService: TonService,
    readonly _tonApiService: TonApiService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TonController.name)
  }

  @Get('deals/:dealId/topup-transaction')
  @UseGuards(AuthGuard, DealGuard)
  async getTopupTransaction(
    @CurrentUser() _user: UserSession,
    @Param('dealId') dealIdParam: string,
    @Query() query: unknown,
  ) {
    const dealId = IdSchema.parse(dealIdParam)
    const {walletAddress} = GetTopupTransactionQuerySchema.parse(query)
    return this.tonService.getTopupTransaction(dealId, walletAddress)
  }

  // @Post('webhook')
  // async handleWebhook(
  //   @Headers('x-webhook-token') webhookToken: string | undefined,
  //   @Body() body: unknown,
  // ) {
  //   this.logger.info({webhookToken, body}, 'Received TonAPI webhook')

  //   if (!this.tonApiService.verifyWebhookToken(webhookToken)) {
  //     throw new UnauthorizedException('Invalid webhook token')
  //   }

  //   // Handle both single and array payloads
  //   const payloads = Array.isArray(body) ? body : [body]
  //   for (const payload of payloads) {
  //     const parsed = TonApiWebhookBodySchema.safeParse(payload)
  //     if (parsed.success) {
  //       await this.tonService.handleWebhook(parsed.data)
  //     } else {
  //       this.logger.error(
  //         {payload, error: parsed.error},
  //         'Failed to parse TonAPI webhook payload',
  //       )
  //     }
  //   }

  //   return {ok: true}
  // }
}
