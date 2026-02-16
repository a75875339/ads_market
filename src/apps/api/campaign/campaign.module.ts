import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {CampaignAdminGuardModule} from '../guards/campaign-admin-guard/campaign-admin-guard.module.js'
import {CampaignController} from './campaign.controller.js'
import {CampaignService} from './campaign.service.js'

@Module({
  imports: [DbModule, AuthGuardModule, CampaignAdminGuardModule],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
