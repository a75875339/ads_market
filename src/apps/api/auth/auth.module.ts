import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {JwtModule} from '../../../libs/secondary/jwt/jwt.module.js'
import {RedisModule} from '../../../libs/secondary/redis/redis.module.js'
import {AuthController} from './auth.controller.js'

@Module({
  imports: [DbModule, RedisModule, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
