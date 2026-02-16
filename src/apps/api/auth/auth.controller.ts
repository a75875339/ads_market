import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type {FastifyReply} from 'fastify'
import {config} from '../../../config/config.js'
import {isDev, isStaging} from '../../../config/environment.js'
import {UserRepository} from '../../../db/repositories/user.repository.js'
import {JwtService} from '../../../libs/secondary/jwt/jwt.service.js'
import {LoginBodySchema} from './auth.schema.js'
import {type TelegramUserSession, validateWebAppData} from './webappdata.js'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  // login and register if not exists
  @Post('tma')
  async login(@Body() body: unknown, @Res() res: FastifyReply) {
    const parsed = LoginBodySchema.strict().parse(body)
    let telegramUser: TelegramUserSession
    try {
      telegramUser = validateWebAppData(
        parsed.telegramRawData,
        config.bot.token,
      )
    } catch (_error) {
      throw new UnauthorizedException('Invalid telegram raw data')
    }

    let user = await this.userRepository.findByTelegramId(
      BigInt(telegramUser.user.id),
    )
    if (!user) {
      user = await this.userRepository.createTelegramUser(
        BigInt(telegramUser.user.id),
        telegramUser.user,
      )
    }
    return this.setCookie(res, user.id)
  }

  private async setCookie(res: FastifyReply, userId: bigint) {
    const token = await this.jwtService.issueToken(
      {sub: String(userId)},
      config.jwt.secret,
      config.jwt.ttl,
    )
    res.setCookie(config.jwt.cookie_name, token, {
      path: '/',
      domain: config.jwt.cookie_domain,
      httpOnly: true,
      secure: true,
      sameSite: isStaging() || isDev() ? 'none' : 'lax',
    })
    return res.send({ok: true, accessToken: token})
  }
}
