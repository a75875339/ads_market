import type {DynamicModule} from '@nestjs/common'
import {DiscoveryModule} from '@nestjs/core'
import type {ILogger} from '../../logger/index.js'
import type {IMetrics} from '../core/index.js'
import {LOGGER_INJECTOR, METRICS_INJECTOR} from './injectors.js'
import type {ArrayOfInstances, Inject, RegisterParams} from './types.js'
import {WorkerManagerService} from './worker-manager.service.js'

export class WorkerManagerModule {
  static register<Injects extends Inject>(
    params: RegisterParams<Injects>,
  ): DynamicModule {
    return {
      module: WorkerManagerModule,
      imports: [DiscoveryModule].concat(params.imports || []),
      providers: [
        WorkerManagerService,
        {
          provide: LOGGER_INJECTOR,
          useFactory: async (
            ...args: ArrayOfInstances<Injects>
          ): Promise<ILogger> => {
            return params.useLogger(...args)
          },
          inject: params.injectLogger,
        },
        {
          provide: METRICS_INJECTOR,
          useFactory: async (
            ...args: ArrayOfInstances<Injects>
          ): Promise<IMetrics> => {
            return params.useMetrics(...args)
          },
          inject: params.injectMetrics,
        },
      ],
      exports: [WorkerManagerService],
    }
  }
}
