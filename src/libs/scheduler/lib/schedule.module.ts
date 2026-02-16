import type {DynamicModule, Provider} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {DiscoveryModule} from '@nestjs/core'
import type {ILogger} from '../../logger/index.js'
import type {
  ArrayOfInstances,
  IMetrics,
  Inject,
  ScheduleModuleOptions,
  ScheduleModuleParams,
} from './interfaces/schedule-module-options.interface.js'
import {
  SCHEDULE_MODULE_OPTIONS,
  SCHEDULER_LOGGER_INJECTOR,
  SCHEDULER_METRICS_INJECTOR,
} from './schedule.constants.js'
import {ScheduleExplorer} from './schedule.explorer.js'
import {SchedulerMetadataAccessor} from './schedule-metadata.accessor.js'
import {SchedulerOrchestrator} from './scheduler.orchestrator.js'
import {SchedulerRegistry} from './scheduler.registry.js'

@Module({
  providers: [SchedulerMetadataAccessor, SchedulerOrchestrator],
})
export class ScheduleModule {
  static forRoot<Injects extends Inject>(
    options: ScheduleModuleOptions = {},
    params?: ScheduleModuleParams<Inject>,
  ): DynamicModule {
    const optionsWithDefaults = {
      cronJobs: true,
      intervals: true,
      timeouts: true,
      ...options,
    }

    const additionalProviders: Provider[] = []

    if (params) {
      additionalProviders.push({
        provide: SCHEDULER_LOGGER_INJECTOR,
        useFactory: async (
          ...args: ArrayOfInstances<Injects>
        ): Promise<ILogger> => {
          return params.useLogger(...args)
        },
        inject: params.injectLogger,
      })
      additionalProviders.push({
        provide: SCHEDULER_METRICS_INJECTOR,
        useFactory: async (
          ...args: ArrayOfInstances<Injects>
        ): Promise<IMetrics> => {
          return params.useMetrics(...args)
        },
        inject: params.injectMetrics,
      })
    } else {
      additionalProviders.push({
        provide: SCHEDULER_METRICS_INJECTOR,
        useValue: null,
      })
    }

    return {
      global: true,
      module: ScheduleModule,
      imports: [DiscoveryModule].concat(params?.imports || []),
      providers: [
        ScheduleExplorer,
        SchedulerRegistry,
        {
          provide: SCHEDULE_MODULE_OPTIONS,
          useValue: optionsWithDefaults,
        },
        ...additionalProviders,
      ],
      exports: [SchedulerRegistry],
    }
  }
}
