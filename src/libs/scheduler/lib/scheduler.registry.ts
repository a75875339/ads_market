/** biome-ignore-all lint/complexity/noBannedTypes: lib */
import {Inject, Injectable, Logger} from '@nestjs/common'
import {CronJob} from 'cron'
import {Timer} from '../../domain/index.js'
import type {IMetrics} from './interfaces/schedule-module-options.interface.js'
import {SCHEDULER_METRICS_INJECTOR} from './schedule.constants.js'
import {DUPLICATE_SCHEDULER, NO_SCHEDULER_FOUND} from './schedule.messages.js'

@Injectable()
export class SchedulerRegistry {
  private readonly logger = new Logger(SchedulerRegistry.name)

  private readonly cronJobs = new Map<string, CronJob>()
  private readonly timeouts = new Map<string, any>()
  private readonly intervals = new Map<string, any>()

  private readonly runOnlyOnceCrons = new Map<string, boolean>()

  constructor(
    @Inject(SCHEDULER_METRICS_INJECTOR)
    private readonly metrics: IMetrics,
  ) {}

  doesExist(type: 'cron' | 'timeout' | 'interval', name: string) {
    switch (type) {
      case 'cron':
        return this.cronJobs.has(name)
      case 'interval':
        return this.intervals.has(name)
      case 'timeout':
        return this.timeouts.has(name)
      default:
        return false
    }
  }

  getCronJob(name: string) {
    const ref = this.cronJobs.get(name)
    if (!ref) {
      throw new Error(NO_SCHEDULER_FOUND('Cron Job', name))
    }
    return ref
  }

  getInterval(name: string) {
    const ref = this.intervals.get(name)
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Interval', name))
    }
    return ref
  }

  getTimeout(name: string) {
    const ref = this.timeouts.get(name)
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Timeout', name))
    }
    return ref
  }

  addCronJob(
    name: string,
    job: CronJob,
    {runOnlyOnce}: {runOnlyOnce: boolean},
  ) {
    const ref = this.cronJobs.get(name)
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Cron Job', name))
    }

    job.fireOnTick = this.wrapFunctionInTryCatchBlocks(
      job.fireOnTick,
      job,
      name,
      this.runOnlyOnceCrons,
      runOnlyOnce,
    )
    this.cronJobs.set(name, job)
  }

  addInterval<T = any>(name: string, intervalId: T) {
    const ref = this.intervals.get(name)
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Interval', name))
    }
    this.intervals.set(name, intervalId)
  }

  addTimeout<T = any>(name: string, timeoutId: T) {
    const ref = this.timeouts.get(name)
    if (ref) {
      throw new Error(DUPLICATE_SCHEDULER('Timeout', name))
    }
    this.timeouts.set(name, timeoutId)
  }

  getCronJobs(): Map<string, CronJob> {
    return this.cronJobs
  }

  deleteCronJob(name: string) {
    const cronJob = this.getCronJob(name)
    cronJob.stop()
    this.cronJobs.delete(name)
  }

  getIntervals(): string[] {
    return [...this.intervals.keys()]
  }

  deleteInterval(name: string) {
    const interval = this.getInterval(name)
    clearInterval(interval)
    this.intervals.delete(name)
  }

  getTimeouts(): string[] {
    return [...this.timeouts.keys()]
  }

  deleteTimeout(name: string) {
    const timeout = this.getTimeout(name)
    clearTimeout(timeout)
    this.timeouts.delete(name)
  }

  private wrapFunctionInTryCatchBlocks(
    methodRef: Function,
    instance: object,
    name: string,
    runOnlyOnceCrons: Map<string, boolean>,
    runOnlyOnce: boolean,
  ): (...args: unknown[]) => Promise<void> {
    return async (...args: unknown[]) => {
      if (runOnlyOnce && runOnlyOnceCrons.get(name)) {
        return
      } else if (runOnlyOnce) {
        runOnlyOnceCrons.set(name, true)
      }

      const timer = new Timer()

      try {
        await methodRef.call(instance, ...args)
        this.metrics?.registerWorkerLoopLatency({
          status: 'success',
          duration: timer.elapsed(),
          name,
        })
      } catch (error) {
        this.logger.error({err: error}, 'Error during scheduled job execution')

        this.metrics?.registerWorkerLoopLatency({
          status: 'fail',
          duration: timer.elapsed(),
          name,
        })
      }
    }
  }
}
