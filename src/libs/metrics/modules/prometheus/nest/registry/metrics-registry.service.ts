import {Injectable} from '@nestjs/common'
import {MetricsRegistryPrometheusService} from '../../register/metrics-registry.prometheus.service.js'

@Injectable()
export class MetricsRegistryService extends MetricsRegistryPrometheusService {}
