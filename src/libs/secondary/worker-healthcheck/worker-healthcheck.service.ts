import {Injectable} from '@nestjs/common'
import {Duration} from '../../domain/index.js'

@Injectable()
export class WorkerHealthcheckService {
  private lastProcessedTime: {
    [workerName: string]: {lastUpdate: number; timeout: Duration}
  } = {}

  public initHealthCheck(workerName: string, timeout: Duration): void {
    this.lastProcessedTime[workerName] = {
      lastUpdate: Date.now(),
      timeout,
    }
  }

  public setLastProcessedTime(workerName: string, time: number): void {
    this.lastProcessedTime[workerName].lastUpdate = time
  }

  public getLastProcessedTime(workerName: string): number {
    return this.lastProcessedTime[workerName].lastUpdate
  }

  public isOk(): boolean {
    for (const workerName in this.lastProcessedTime) {
      const worker = this.lastProcessedTime[workerName]
      const isOk =
        Date.now() - worker.lastUpdate <= worker.timeout.toMilliseconds()

      if (!isOk) {
        return false
      }
    }

    return true
  }
}
