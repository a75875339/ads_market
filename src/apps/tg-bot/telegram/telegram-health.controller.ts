import {Controller, Get, InternalServerErrorException} from '@nestjs/common'
import {TelegramService} from './telegram.service.js'

@Controller()
export class TelegramHealthController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('/healthcheck')
  async healthcheck(): Promise<{status: string; username?: string}> {
    const health = await this.telegramService.getHealth()

    if (health.ok) {
      return {status: 'OK', username: health.username}
    }

    throw new InternalServerErrorException('Bot health check failed')
  }
}
