import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  eq,
  notifications,
  recipes,
  users,
  type Database,
} from '@repo/db';
import { count, desc } from 'drizzle-orm';
import { DATABASE } from '../db/database.constants';

type NotificationType = 'like' | 'comment' | 'reply' | 'rating' | 'tried';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** No-ops when the actor is the recipient (e.g. liking your own recipe). */
  async create(params: {
    userId: string;
    actorId: string;
    type: NotificationType;
    recipeId?: string;
    data?: string;
  }) {
    if (params.userId === params.actorId) return null;

    const [notification] = await this.db
      .insert(notifications)
      .values(params)
      .returning();

    return notification;
  }

  async findForUser(userId: string, limit = 30) {
    return this.db
      .select({
        id: notifications.id,
        type: notifications.type,
        recipeId: notifications.recipeId,
        data: notifications.data,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        actor: {
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        },
        recipeTitle: recipes.title,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .leftJoin(recipes, eq(notifications.recipeId, recipes.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async unreadCount(userId: string) {
    const [row] = await this.db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return row?.count ?? 0;
  }

  async markRead(id: string, userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));

    return { success: true };
  }
}
