// biome-ignore lint/correctness/noUnusedImports: extend FastifyRequest interface
import FastifyRequest from 'fastify'
import {UserSession} from './libs/common/types/user-session.types.ts'
import {DealGuardResult} from './apps/api/guards/deal-guard/deal.guard.ts'

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: UserSession
    dealGuardResult?: DealGuardResult
  }

  interface Session extends ExpressSessionData {
    userId: string
  }
}
