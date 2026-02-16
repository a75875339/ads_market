import {Module} from '@nestjs/common'
import {JwtModule} from '../../../../libs/secondary/jwt/jwt.module.js'
import {AuthGuard} from './auth.guard.js'

@Module({
  imports: [JwtModule],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthGuardModule {}
