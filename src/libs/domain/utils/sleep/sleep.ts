import {Duration} from '../../time/duration/duration.js'

export async function sleep(ms: Duration): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms.toMilliseconds()))
}
