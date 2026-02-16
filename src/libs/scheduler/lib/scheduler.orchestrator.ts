/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: lib */
/** biome-ignore-all lint/complexity/noBannedTypes: lib */

import {randomUUID as v4} from 'node:crypto'
import type {
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common'
import {Injectable} from '@nestjs/common'
import type {CronCallback, CronJobParams} from 'cron'
import {CronJob} from 'cron'
import type {CronOptions} from './decorators/cron.decorator.js'
import {SchedulerRegistry} from './scheduler.registry.js'

type TargetHost = {target: Function}
type TimeoutHost = {timeout: number}
type RefHost<T> = {ref?: T}

type CronOptionsHost = {
  options: CronOptions & Record<'cronTime', CronJobParams['cronTime']>
}

type IntervalOptions = TargetHost & TimeoutHost & RefHost<NodeJS.Timeout>
type TimeoutOptions = TargetHost & TimeoutHost & RefHost<NodeJS.Timeout>
type CronJobOptions = TargetHost & CronOptionsHost & RefHost<CronJob>

@Injectable()
export class SchedulerOrchestrator
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly cronJobs: Record<string, CronJobOptions> = {}
  private readonly timeouts: Record<string, TimeoutOptions> = {}
  private readonly intervals: Record<string, IntervalOptions> = {}

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  onApplicationBootstrap() {
    this.mountTimeouts()
    this.mountIntervals()
    this.mountCron()
  }

  onApplicationShutdown() {
    this.clearTimeouts()
    this.clearIntervals()
    this.closeCronJobs()
  }

  mountIntervals() {
    const intervalKeys = Object.keys(this.intervals)
    intervalKeys.forEach((key) => {
      const options = this.intervals[key]
      // @ts-expect-error ignore
      const intervalRef = setInterval(options.target, options.timeout)

      options.ref = intervalRef
      this.schedulerRegistry.addInterval(key, intervalRef)
    })
  }

  mountTimeouts() {
    const timeoutKeys = Object.keys(this.timeouts)
    timeoutKeys.forEach((key) => {
      const options = this.timeouts[key]
      // @ts-expect-error ignore
      const timeoutRef = setTimeout(options.target, options.timeout)

      options.ref = timeoutRef
      this.schedulerRegistry.addTimeout(key, timeoutRef)
    })
  }

  mountCron() {
    const cronKeys = Object.keys(this.cronJobs)
    cronKeys.forEach((key) => {
      const {options, target} = this.cronJobs[key]
      const cronJob = CronJob.from({
        ...options,
        onTick: target as CronCallback<null, false>,
        start: !options.disabled,
        waitForCompletion: true,
      })

      this.cronJobs[key].ref = cronJob
      this.schedulerRegistry.addCronJob(key, cronJob, {
        runOnlyOnce: Boolean(options.runOnlyOnce),
      })
    })
  }

  clearTimeouts() {
    this.schedulerRegistry
      .getTimeouts()
      .forEach((key) => this.schedulerRegistry.deleteTimeout(key))
  }

  clearIntervals() {
    this.schedulerRegistry
      .getIntervals()
      .forEach((key) => this.schedulerRegistry.deleteInterval(key))
  }

  closeCronJobs() {
    Array.from(this.schedulerRegistry.getCronJobs().keys()).forEach((key) =>
      this.schedulerRegistry.deleteCronJob(key),
    )
  }

  addTimeout(methodRef: Function, timeout: number, name: string = v4()) {
    this.timeouts[name] = {
      target: methodRef,
      timeout,
    }
  }

  addInterval(methodRef: Function, timeout: number, name: string = v4()) {
    this.intervals[name] = {
      target: methodRef,
      timeout,
    }
  }

  addCron(
    methodRef: Function,
    options: CronOptions & Record<'cronTime', CronJobParams['cronTime']>,
  ) {
    const name = options.name || v4()
    this.cronJobs[name] = {
      target: methodRef,
      options,
    }
  }
}
