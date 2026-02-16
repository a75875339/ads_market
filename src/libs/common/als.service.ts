import {AsyncLocalStorage} from 'node:async_hooks'

type RequestContext = {
  correlationId: string
}

class AlsService {
  private readonly als = new AsyncLocalStorage<RequestContext>()

  run<T>(context: RequestContext, callback: () => T): T {
    return this.als.run(context, callback)
  }

  getCorrelationId(): string | null {
    const store = this.als.getStore()
    return store?.correlationId ?? null
  }

  getCorrelationIdOrThrow(): string {
    const correlationId = this.getCorrelationId()
    if (correlationId == null) {
      throw new Error('Correlation ID not found in AsyncLocalStorage')
    }
    return correlationId
  }
}

export const alsService = new AlsService()
