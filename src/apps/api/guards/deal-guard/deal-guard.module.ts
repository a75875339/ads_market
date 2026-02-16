import {Module} from '@nestjs/common'
import {DbModule} from '../../../../db/db.module.js'
import {DealGuard} from './deal.guard.js'

@Module({
  imports: [DbModule],
  providers: [DealGuard],
  exports: [DealGuard],
})
export class DealGuardModule {}
