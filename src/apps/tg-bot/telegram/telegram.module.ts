import {Module} from '@nestjs/common'
import {RedisModule} from '../../../libs/secondary/redis/redis.module.js'
import {UsersModule} from '../../../modules/users/users.module.js'
import {ChannelAdminHandlersService} from './channel-admin-handlers.service.js'
import {ChannelPostHandlersService} from './channel-post-handlers.service.js'
import {DealTopicHandlersService} from './deal-topic-handlers.service.js'
import {TelegramController} from './telegram.controller.js'
import {TelegramService} from './telegram.service.js'
import {TelegramHealthController} from './telegram-health.controller.js'

@Module({
  imports: [UsersModule, RedisModule],
  controllers: [TelegramController, TelegramHealthController],
  providers: [
    ChannelAdminHandlersService,
    ChannelPostHandlersService,
    DealTopicHandlersService,
    TelegramService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
