import {z} from 'zod'
import {ManagerPermission} from '../../../db/constants.js'

export const UpdateManagerPermissionBodySchema = z.object({
  permissions: z.enum(Object.values(ManagerPermission)),
})

export type UpdateManagerPermissionBody = z.infer<
  typeof UpdateManagerPermissionBodySchema
>
