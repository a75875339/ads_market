import {Module} from '@nestjs/common'
import {DbModule} from '../../../../db/db.module.js'
import {ChannelManagerGuard} from './channel-manager.guard.js'

@Module({
  imports: [DbModule],
  providers: [ChannelManagerGuard],
  exports: [ChannelManagerGuard],
})
export class ChannelManagerGuardModule {}
