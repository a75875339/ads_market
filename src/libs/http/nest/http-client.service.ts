import {Injectable} from '@nestjs/common'
import {HttpClient} from '../core/index.js'
import type {IHttpClient} from '../core/types.js'

@Injectable()
export class HttpClientService extends HttpClient implements IHttpClient {}
