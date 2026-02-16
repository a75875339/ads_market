import {Injectable} from '@nestjs/common'
import * as jose from 'jose'
import {PinoLogger} from 'nestjs-pino'
import {RoundMode} from '../../domain/common/types/number.js'
import {Duration} from '../../domain/index.js'

type JwtPayload = {
  sub: string
  iat: number
  exp: number
}

@Injectable()
export class JwtService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(JwtService.name)
  }

  async checkToken<T>(token: string, secret: string): Promise<T> {
    try {
      const bufferSecret = new TextEncoder().encode(secret)
      const {payload} = await jose.jwtVerify<JwtPayload>(token, bufferSecret, {
        algorithms: ['HS256'],
      })

      return payload as T
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        this.logger.warn('token expired')
      } else if (error instanceof jose.errors.JWTInvalid) {
        this.logger.warn(`token validation failed: ${error.message}`)
      } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
        this.logger.warn(`token claim validation failed: ${error.message}`)
      } else {
        this.logger.warn(`unexpected token verification error: ${error}`)
      }
      throw new Error('auth failed')
    }
  }

  async issueToken(
    data: jose.JWTPayload,
    secret: string,
    ttl: Duration,
  ): Promise<string> {
    const bufferSecret = new TextEncoder().encode(secret)

    return await new jose.SignJWT(data)
      .setProtectedHeader({alg: 'HS256'})
      .setIssuedAt()
      .setExpirationTime(`${ttl.toSeconds(RoundMode.Down)}s`)
      .sign(bufferSecret)
  }
}
