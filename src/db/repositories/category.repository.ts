import {Inject, Injectable} from '@nestjs/common'
import {DB_TOKEN, type DBType} from '../db.tokens.js'
import {categories} from '../tables/categories.table.js'

export type CategoryRow = typeof categories.$inferSelect

@Injectable()
export class CategoryRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DBType) {}

  async listOrdered(): Promise<CategoryRow[]> {
    return this.db.query.categories.findMany({
      orderBy: {orderValue: 'asc'},
    })
  }
}
