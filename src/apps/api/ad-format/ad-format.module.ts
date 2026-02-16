import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {ChannelManagerGuardModule} from '../guards/channel-manager-guard/channel-manager-guard.module.js'
import {AdFormatsController} from './ad-format.controller.js'

@Module({
  imports: [DbModule, AuthGuardModule, ChannelManagerGuardModule],
  controllers: [AdFormatsController],
})
export class AdFormatModule {}
