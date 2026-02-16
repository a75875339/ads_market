import {Controller, Get, UseGuards} from '@nestjs/common'
import {
  CategoryRepository,
  type CategoryRow,
} from '../../../db/repositories/category.repository.js'
import {AuthGuard} from '../guards/auth/auth.guard.js'

@UseGuards(AuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  private mapCategory(row: CategoryRow) {
    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      emoji: row.emoji,
    }
  }

  @Get()
  async list() {
    const categories = await this.categoryRepository.listOrdered()
    return categories.map(this.mapCategory)
  }
}
