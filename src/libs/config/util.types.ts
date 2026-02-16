import type {output, ZodTypeAny} from 'zod'

export type GetConfigType<A extends ZodTypeAny> = output<A>
