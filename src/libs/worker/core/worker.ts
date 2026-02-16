import {Duration, Timer} from '../../../libs/domain/index.js'
import type {ILogger} from '../../logger/index.js'
import type {IMetrics, Task} from './types.js'

export class Worker {
  fn: () => Promise<void>

  interval: number

  name: string

  isStarted: boolean

  activeInterval: null

  activePromise: null | Promise<void>

  nextJobTimeoutId: ReturnType<typeof setTimeout> | undefined

  constructor(
    fn: Task,
    minInterval: Duration,
    name: string,
    private readonly logger?: ILogger,
    private readonly metrics?: IMetrics,
  ) {
    this.fn = async (): Promise<void> => {
      const timer = new Timer()
      try {
        await fn()
        this.metrics?.registerWorkerLoopLatency({
          status: 'success',
          duration: timer.elapsed(),
          name,
        })
      } catch (err) {
        this.logger?.error({err}, `Error in worker ${name}`)
        this.metrics?.registerWorkerLoopLatency({
          status: 'fail',
          duration: timer.elapsed(),
          name,
        })
      }
    }

    this.interval = minInterval.toMilliseconds()
    this.name = name
    this.tick = this.tick.bind(this)
    this.isStarted = false
    this.activeInterval = null
    this.activePromise = null
  }

  public start(): void {
    if (!this.isStarted) {
      this.isStarted = true
      this.logger?.debug(`Worker ${this.name} started`)
      process.nextTick(() => this.tick())
    }
  }

  public async stop(): Promise<void> {
    if (this.isStarted) {
      this.isStarted = false

      // cancel next job if exist
      if (this.nextJobTimeoutId) {
        clearTimeout(this.nextJobTimeoutId)
      }

      // wait for last job
      await this.activePromise

      this.logger?.debug(`Worker ${this.name} stopped`)
    }
  }

  private tick(): void {
    if (!this.isStarted) {
      return
    }

    const startTime = Date.now()

    this.activePromise = this.fn().then(() => {
      const execTime = Date.now() - startTime
      const runAfter = this.interval - execTime

      // schedule the next job
      this.nextJobTimeoutId = setTimeout(this.tick, Math.max(0, runAfter))
    })
  }
}
