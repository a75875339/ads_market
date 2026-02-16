import type {CanActivate, ExecutionContext} from '@nestjs/common'
import {Injectable} from '@nestjs/common'
import type {FastifyRequest} from 'fastify'
import {config} from '../../../../config/config.js'
import {isDev, isStaging} from '../../../../config/environment.js'
import {JwtService} from '../../../../libs/secondary/jwt/jwt.service.js'

type JwtPayload = {sub: string}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>()
    const token = this.extractToken(req)
    if (!token) {
      return false
    }
    try {
      const payload = await this.jwtService.checkToken<JwtPayload>(
        token,
        config.jwt.secret,
      )
      req.currentUser = {id: BigInt(payload.sub)}
      return true
    } catch {
      return false
    }
  }

  private extractToken(req: FastifyRequest): string | null {
    if (isDev() || isStaging()) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7)
      }
    }
    const cookie = req.cookies?.[config.jwt.cookie_name]
    if (cookie && typeof cookie === 'string') {
      return cookie
    }
    return null
  }
}
