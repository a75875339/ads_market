import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {CategoriesController} from './category.controller.js'

@Module({
  imports: [DbModule, AuthGuardModule],
  controllers: [CategoriesController],
})
export class CategoryModule {}
