import {Module} from '@nestjs/common'
import {JwtService} from './jwt.service.js'

@Module({
  imports: [],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
