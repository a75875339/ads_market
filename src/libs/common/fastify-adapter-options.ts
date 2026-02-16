import {randomUUID} from 'node:crypto'
import {IncomingMessage} from 'node:http'
import {Http2ServerRequest} from 'node:http2'

export const fastifyAdapterOptions = {
  genReqId: (req: IncomingMessage | Http2ServerRequest) => {
    const existingID = req.headers['x-request-id']
    if (existingID) return existingID as string
    const id = randomUUID()

    return id
  },
  // need this optinon to get client IP
  trustProxy: true,
  // disable auto HEAD route generation since we define them manually
  exposeHeadRoutes: false,
}
