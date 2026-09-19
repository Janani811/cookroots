import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  eq,
  groceryItems,
  groceryLists,
  ingredients,
  recipes,
  type Database,
} from '@repo/db';
import { DATABASE } from '../db/database.constants';
import type { CreateGroceryListDto } from './dto/grocery.dto';

@Injectable()
export class GroceryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async createFromRecipe(userId: string, recipeId: string, name?: string) {
    const recipeIngredients = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, recipeId));

    let listName = name?.trim();
    if (!listName) {
      const [recipe] = await this.db
        .select({ title: recipes.title })
        .from(recipes)
        .where(eq(recipes.id, recipeId))
        .limit(1);
      listName = recipe ? `${recipe.title} groceries` : 'Grocery list';
    }

    const [list] = await this.db
      .insert(groceryLists)
      .values({
        userId,
        recipeId,
        name: listName,
      })
      .returning();

    if (!list) throw new Error('Failed to create grocery list');

    if (recipeIngredients.length > 0) {
      await this.db.insert(groceryItems).values(
        recipeIngredients.map((item: (typeof recipeIngredients)[number]) => ({
          listId: list.id,
          name: item.name,
          quantity: item.quantity,
        })),
      );
    }

    return this.findById(list.id, userId);
  }

  async create(userId: string, dto: CreateGroceryListDto) {
    const [list] = await this.db
      .insert(groceryLists)
      .values({
        userId,
        recipeId: dto.recipeId,
        name: dto.name,
      })
      .returning();

    if (!list) throw new Error('Failed to create grocery list');

    if (dto.items.length > 0) {
      await this.db.insert(groceryItems).values(
        dto.items.map((item) => ({
          listId: list.id,
          name: item.name,
          quantity: item.quantity,
        })),
      );
    }

    return this.findById(list.id, userId);
  }

  async findByUser(userId: string, requesterId: string) {
    if (userId !== requesterId) {
      throw new ForbiddenException("Cannot view another user's grocery lists");
    }

    return this.db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.userId, userId));
  }

  async findById(listId: string, requesterId: string) {
    const [list] = await this.db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.id, listId))
      .limit(1);

    if (!list) throw new NotFoundException('Grocery list not found');
    if (list.userId !== requesterId) {
      throw new ForbiddenException("Cannot view another user's grocery list");
    }

    const items = await this.db
      .select()
      .from(groceryItems)
      .where(eq(groceryItems.listId, listId));

    return { ...list, items };
  }

  private async assertOwnsList(listId: string, requesterId: string) {
    const [list] = await this.db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.id, listId))
      .limit(1);

    if (!list) throw new NotFoundException('Grocery list not found');
    if (list.userId !== requesterId) {
      throw new ForbiddenException("Cannot modify another user's grocery list");
    }

    return list;
  }

  async rename(listId: string, name: string, requesterId: string) {
    await this.assertOwnsList(listId, requesterId);

    const [list] = await this.db
      .update(groceryLists)
      .set({ name })
      .where(eq(groceryLists.id, listId))
      .returning();

    return list;
  }

  async deleteList(listId: string, requesterId: string) {
    await this.assertOwnsList(listId, requesterId);
    await this.db.delete(groceryLists).where(eq(groceryLists.id, listId));
    return { deleted: true };
  }

  async addItem(
    listId: string,
    item: { name: string; quantity?: string },
    requesterId: string,
  ) {
    await this.assertOwnsList(listId, requesterId);

    const [created] = await this.db
      .insert(groceryItems)
      .values({ listId, name: item.name, quantity: item.quantity })
      .returning();

    return created;
  }

  async removeItem(itemId: string, requesterId: string) {
    const [row] = await this.db
      .select({ list: groceryLists })
      .from(groceryItems)
      .innerJoin(groceryLists, eq(groceryItems.listId, groceryLists.id))
      .where(eq(groceryItems.id, itemId))
      .limit(1);

    if (!row) throw new NotFoundException('Grocery item not found');
    if (row.list.userId !== requesterId) {
      throw new ForbiddenException("Cannot modify another user's grocery list");
    }

    await this.db.delete(groceryItems).where(eq(groceryItems.id, itemId));
    return { deleted: true };
  }

  async toggleItem(itemId: string, isChecked: boolean, requesterId: string) {
    const [row] = await this.db
      .select({ list: groceryLists })
      .from(groceryItems)
      .innerJoin(groceryLists, eq(groceryItems.listId, groceryLists.id))
      .where(eq(groceryItems.id, itemId))
      .limit(1);

    if (!row) throw new NotFoundException('Grocery item not found');
    if (row.list.userId !== requesterId) {
      throw new ForbiddenException("Cannot modify another user's grocery list");
    }

    const [item] = await this.db
      .update(groceryItems)
      .set({ isChecked })
      .where(eq(groceryItems.id, itemId))
      .returning();

    return item;
  }
}
