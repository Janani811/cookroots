import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  commentLikes,
  eq,
  reactions,
  recipeComments,
  recipeLikes,
  recipeRatings,
  recipes,
  triedPosts,
  users,
  type Database,
} from '@repo/db';
import { count, desc, inArray } from 'drizzle-orm';
import { DATABASE } from '../db/database.constants';
import { NotificationsService } from '../notifications/notifications.service';
import type { ReactionTargetType } from './dto/social.dto';

@Injectable()
export class SocialService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getRecipeOwner(recipeId: string): Promise<string | null> {
    const [recipe] = await this.db
      .select({ createdBy: recipes.createdBy })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    return recipe?.createdBy ?? null;
  }

  async likeRecipe(recipeId: string, userId: string) {
    const ownerId = await this.getRecipeOwner(recipeId);
    if (ownerId === userId) {
      throw new ForbiddenException('You cannot like your own recipe');
    }

    const result = await this.db
      .insert(recipeLikes)
      .values({ recipeId, userId })
      .onConflictDoNothing()
      .returning();

    if (result.length > 0 && ownerId) {
      await this.notificationsService.create({
        userId: ownerId,
        actorId: userId,
        type: 'like',
        recipeId,
      });
    }

    return result;
  }

  unlikeRecipe(recipeId: string, userId: string) {
    return this.db
      .delete(recipeLikes)
      .where(
        and(eq(recipeLikes.recipeId, recipeId), eq(recipeLikes.userId, userId)),
      )
      .returning();
  }

  async getComments(recipeId: string, viewerUserId?: string) {
    const rows = await this.db
      .select({
        id: recipeComments.id,
        recipeId: recipeComments.recipeId,
        parentCommentId: recipeComments.parentCommentId,
        content: recipeComments.content,
        createdAt: recipeComments.createdAt,
        userId: recipeComments.userId,
        userName: users.name,
        userProfileImage: users.profileImage,
      })
      .from(recipeComments)
      .innerJoin(users, eq(recipeComments.userId, users.id))
      .where(eq(recipeComments.recipeId, recipeId))
      .orderBy(desc(recipeComments.createdAt));

    const commentIds = rows.map((r) => r.id);
    const [likeCounts, viewerLikedIds, reactionSummaries] = await Promise.all([
      this.getLikeCounts(commentIds),
      viewerUserId
        ? this.getViewerLikedCommentIds(commentIds, viewerUserId)
        : Promise.resolve(new Set<string>()),
      this.getReactionSummaries('comment', commentIds, viewerUserId),
    ]);

    return rows.map((row) => ({
      id: row.id,
      recipeId: row.recipeId,
      parentCommentId: row.parentCommentId,
      text: row.content,
      content: row.content,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        name: row.userName,
        profileImage: row.userProfileImage,
      },
      likesCount: likeCounts.get(row.id) ?? 0,
      likedByViewer: viewerLikedIds.has(row.id),
      reactions: reactionSummaries.get(row.id) ?? [],
    }));
  }

  async comment(
    recipeId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
  ) {
    if (parentCommentId) {
      const [parent] = await this.db
        .select({
          id: recipeComments.id,
          recipeId: recipeComments.recipeId,
          parentCommentId: recipeComments.parentCommentId,
          userId: recipeComments.userId,
        })
        .from(recipeComments)
        .where(eq(recipeComments.id, parentCommentId))
        .limit(1);

      if (!parent || parent.recipeId !== recipeId) {
        throw new NotFoundException('Comment not found');
      }
      if (parent.parentCommentId) {
        throw new BadRequestException('Cannot reply to a reply');
      }
    }

    const [comment] = await this.db
      .insert(recipeComments)
      .values({ recipeId, userId, content, parentCommentId })
      .returning();

    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (parentCommentId) {
      const [parent] = await this.db
        .select({ userId: recipeComments.userId })
        .from(recipeComments)
        .where(eq(recipeComments.id, parentCommentId))
        .limit(1);
      if (parent) {
        await this.notificationsService.create({
          userId: parent.userId,
          actorId: userId,
          type: 'reply',
          recipeId,
          data: content.slice(0, 140),
        });
      }
    } else {
      const ownerId = await this.getRecipeOwner(recipeId);
      if (ownerId) {
        await this.notificationsService.create({
          userId: ownerId,
          actorId: userId,
          type: 'comment',
          recipeId,
          data: content.slice(0, 140),
        });
      }
    }

    return {
      ...comment,
      text: comment.content,
      user: user ?? { id: userId, name: 'User', profileImage: null },
      likesCount: 0,
      likedByViewer: false,
      reactions: [],
    };
  }

  async likeComment(commentId: string, userId: string) {
    return this.db
      .insert(commentLikes)
      .values({ commentId, userId })
      .onConflictDoNothing()
      .returning();
  }

  unlikeComment(commentId: string, userId: string) {
    return this.db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, userId),
        ),
      )
      .returning();
  }

  private async getLikeCounts(
    commentIds: string[],
  ): Promise<Map<string, number>> {
    if (commentIds.length === 0) return new Map();
    const rows = await this.db
      .select({ commentId: commentLikes.commentId, n: count() })
      .from(commentLikes)
      .where(inArray(commentLikes.commentId, commentIds))
      .groupBy(commentLikes.commentId);
    return new Map(rows.map((r) => [r.commentId, r.n]));
  }

  private async getViewerLikedCommentIds(
    commentIds: string[],
    userId: string,
  ): Promise<Set<string>> {
    if (commentIds.length === 0) return new Set();
    const rows = await this.db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(
        and(
          inArray(commentLikes.commentId, commentIds),
          eq(commentLikes.userId, userId),
        ),
      );
    return new Set(rows.map((r) => r.commentId));
  }

  async react(
    targetType: ReactionTargetType,
    targetId: string,
    userId: string,
    emoji: string,
  ) {
    return this.db
      .insert(reactions)
      .values({ targetType, targetId, userId, emoji })
      .onConflictDoNothing()
      .returning();
  }

  unreact(
    targetType: ReactionTargetType,
    targetId: string,
    userId: string,
    emoji: string,
  ) {
    return this.db
      .delete(reactions)
      .where(
        and(
          eq(reactions.targetType, targetType),
          eq(reactions.targetId, targetId),
          eq(reactions.userId, userId),
          eq(reactions.emoji, emoji),
        ),
      )
      .returning();
  }

  async getReactionsForTarget(
    targetType: ReactionTargetType,
    targetId: string,
    viewerUserId?: string,
  ) {
    const summaries = await this.getReactionSummaries(
      targetType,
      [targetId],
      viewerUserId,
    );
    return summaries.get(targetId) ?? [];
  }

  private async getReactionSummaries(
    targetType: ReactionTargetType,
    targetIds: string[],
    viewerUserId?: string,
  ): Promise<
    Map<string, { emoji: string; count: number; reactedByViewer: boolean }[]>
  > {
    if (targetIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        targetId: reactions.targetId,
        emoji: reactions.emoji,
        n: count(),
      })
      .from(reactions)
      .where(
        and(
          eq(reactions.targetType, targetType),
          inArray(reactions.targetId, targetIds),
        ),
      )
      .groupBy(reactions.targetId, reactions.emoji);

    const viewerRows = viewerUserId
      ? await this.db
          .select({ targetId: reactions.targetId, emoji: reactions.emoji })
          .from(reactions)
          .where(
            and(
              eq(reactions.targetType, targetType),
              inArray(reactions.targetId, targetIds),
              eq(reactions.userId, viewerUserId),
            ),
          )
      : [];
    const viewerSet = new Set(
      viewerRows.map((r) => `${r.targetId}:${r.emoji}`),
    );

    const map = new Map<
      string,
      { emoji: string; count: number; reactedByViewer: boolean }[]
    >();
    for (const row of rows) {
      const list = map.get(row.targetId) ?? [];
      list.push({
        emoji: row.emoji,
        count: row.n,
        reactedByViewer: viewerSet.has(`${row.targetId}:${row.emoji}`),
      });
      map.set(row.targetId, list);
    }
    return map;
  }

  async rate(recipeId: string, userId: string, rating: number) {
    const ownerId = await this.getRecipeOwner(recipeId);
    if (ownerId === userId) {
      throw new ForbiddenException('You cannot rate your own recipe');
    }

    const result = await this.db
      .insert(recipeRatings)
      .values({ recipeId, userId, rating })
      .onConflictDoUpdate({
        target: [recipeRatings.recipeId, recipeRatings.userId],
        set: { rating },
      })
      .returning();

    if (ownerId) {
      await this.notificationsService.create({
        userId: ownerId,
        actorId: userId,
        type: 'rating',
        recipeId,
        data: String(rating),
      });
    }

    return result;
  }

  async triedPost(
    recipeId: string,
    userId: string,
    imageUrl?: string,
    comment?: string,
    rating?: number,
  ) {
    const result = await this.db
      .insert(triedPosts)
      .values({ recipeId, userId, imageUrl, comment, rating })
      .returning();

    const ownerId = await this.getRecipeOwner(recipeId);
    if (ownerId) {
      await this.notificationsService.create({
        userId: ownerId,
        actorId: userId,
        type: 'tried',
        recipeId,
      });
    }

    return result;
  }
}
