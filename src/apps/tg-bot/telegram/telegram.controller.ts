import {Controller, Post, Req, Res} from '@nestjs/common'
import type {FastifyReply, FastifyRequest} from 'fastify'
import {TelegramService} from './telegram.service.js'

@Controller('/telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('/webhook')
  async handleWebhook(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    await this.telegramService.handleUpdate(req, res)
  }
}
