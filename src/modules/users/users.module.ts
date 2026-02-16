import {Module} from '@nestjs/common'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {UserService} from './users.service.js'

@Module({
  imports: [RedisModule],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
