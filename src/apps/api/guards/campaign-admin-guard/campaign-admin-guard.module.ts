import {Module} from '@nestjs/common'
import {DbModule} from '../../../../db/db.module.js'
import {CampaignAdminGuard} from './campaign-admin.guard.js'

@Module({
  imports: [DbModule],
  providers: [CampaignAdminGuard],
  exports: [CampaignAdminGuard],
})
export class CampaignAdminGuardModule {}
