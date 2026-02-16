import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {ChannelController} from './channel.controller.js'

@Module({
  imports: [DbModule, AuthGuardModule],
  controllers: [ChannelController],
})
export class ChannelModule {}
