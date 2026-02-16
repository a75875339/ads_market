import {Module} from '@nestjs/common'
import {UserSeedService} from './user-seed.service.js'

@Module({
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
