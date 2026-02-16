import type {OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import {DiscoveryService, MetadataScanner, Reflector} from '@nestjs/core'
import {InstanceWrapper} from '@nestjs/core/injector/instance-wrapper.js'
import {Duration} from '../../../libs/domain/index.js'
import type {ILogger} from '../../logger/index.js'
import {Worker} from '../core/index.js'
import type {IMetrics, Task} from '../core/types.js'
import {LOGGER_INJECTOR, METRICS_INJECTOR} from './injectors.js'
import {INTERVAL_DECORATOR_METADATA_KEY} from './metadata.keys.js'

@Injectable()
export class WorkerManagerService implements OnModuleDestroy, OnModuleInit {
  private readonly workers: Worker[] = []

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    public readonly reflector: Reflector,
    @Inject(LOGGER_INJECTOR)
    private readonly logger: ILogger,
    @Inject(METRICS_INJECTOR)
    private readonly metrics: IMetrics,
  ) {}

  public addTask(name: string, task: Task, interval: Duration): void {
    const worker = new Worker(task, interval, name, this.logger, this.metrics)
    this.workers.push(worker)
    worker.start()
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.stop()))
  }

  onModuleInit(): void {
    this.addDecoratorWorkers()
  }

  private addDecoratorWorkers(): void {
    const controllers: InstanceWrapper[] =
      this.discoveryService.getControllers()

    for (const controller of controllers) {
      {
        const methods = [
          ...this.metadataScanner.getAllFilteredMethodNames(
            controller.instance,
          ),
        ]

        for (const method of methods) {
          const metadata = Reflect.getMetadata(
            INTERVAL_DECORATOR_METADATA_KEY,
            controller.instance[method],
          )

          if (!metadata) {
            continue
          }

          const name = controller.name.replace('Controller', '') + '.' + method
          const task = controller.instance[method].bind(controller.instance)
          this.addTask(name, task, /** Interval */ metadata)
        }
      }
    }
  }
}
