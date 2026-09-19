import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  and,
  eq,
  ilike,
  ingredients,
  media,
  or,
  recipeBadges,
  recipeComments,
  recipeLikes,
  recipeNutrition,
  recipeTranslations,
  recipes,
  sql,
  steps,
  users,
  type Database,
} from '@repo/db';
import { count } from 'drizzle-orm';
import type { HealthBadge, StructuredRecipe } from '@repo/types';
import { DATABASE } from '../database/database.module';
import { AiService } from '../ai/ai.service';
import type { CreateRecipeDto, UpdateRecipeDto } from './dto/recipes.dto';

type RecipeRow = typeof recipes.$inferSelect;
type IngredientRow = typeof ingredients.$inferSelect;

const MEAT_EGG_KEYWORDS = [
  'chicken',
  'mutton',
  'beef',
  'pork',
  'bacon',
  'ham',
  'meat',
  'fish',
  'prawn',
  'shrimp',
  'crab',
  'squid',
  'octopus',
  'anchovy',
  'lamb',
  'turkey',
  'duck',
  'goat',
  'venison',
  'egg',
  'eggs',
  'non-veg',
  'nonveg',
];

function recipeText(recipe: StructuredRecipe): string {
  const ingredientNames = recipe.ingredients?.map((i) => i.name).join(' ') ?? '';
  const tags = recipe.tags?.join(' ') ?? '';
  return `${ingredientNames} ${tags}`.toLowerCase();
}

function containsMeatOrEgg(recipe: StructuredRecipe): boolean {
  const text = recipeText(recipe);
  return MEAT_EGG_KEYWORDS.some((keyword) =>
    new RegExp(`\\b${keyword}\\b`).test(text),
  );
}

function sanitizeDietaryBadges(
  recipe: StructuredRecipe,
  badges: HealthBadge[],
): HealthBadge[] {
  if (!containsMeatOrEgg(recipe)) return badges;
  return badges.filter((b) => b !== 'vegetarian' && b !== 'vegan');
}

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateRecipeDto, userId: string) {
    const [recipe] = await this.db
      .insert(recipes)
      .values({
        title: dto.title,
        description: dto.description,
        rawInput: dto.rawInput,
        createdBy: userId,
        cookingTimeMinutes: dto.cookingTimeMinutes,
        difficulty: dto.difficulty,
        status: dto.status ?? 'published',
        visibility: dto.visibility ?? 'public',
        tags: dto.tags ?? [],
        language: dto.language ?? null,
      })
      .returning();

    if (!recipe) throw new Error('Failed to create recipe');

    if (dto.ingredients.length > 0) {
      await this.db.insert(ingredients).values(
        dto.ingredients.map((item) => ({
          recipeId: recipe.id,
          name: item.name,
          quantity: item.quantity,
        })),
      );
    }

    if (dto.steps.length > 0) {
      await this.db.insert(steps).values(
        dto.steps.map((item) => ({
          recipeId: recipe.id,
          stepNumber: item.stepNumber,
          instructionText: item.instructionText,
          audioUrl: item.audioUrl,
        })),
      );
    }

    if (dto.imageUrl) {
      await this.db
        .insert(media)
        .values({ recipeId: recipe.id, type: 'image', url: dto.imageUrl });
    }

    await this.classifyAndPersistHealth(recipe.id, {
      title: dto.title,
      description: dto.description,
      ingredients: dto.ingredients,
      steps: dto.steps,
      cookingTimeMinutes: dto.cookingTimeMinutes ?? null,
      difficulty: dto.difficulty ?? null,
      tags: dto.tags ?? [],
    });

    return this.findById(recipe.id, userId);
  }

  async findAll(
    filters?: {
      q?: string;
      search?: string;
      tag?: string;
      difficulty?: string;
      createdBy?: string;
    },
    viewerUserId?: string,
  ) {
    const conditions = [];
    const isOwnRecipes =
      !!filters?.createdBy && filters.createdBy === viewerUserId;

    if (filters?.createdBy) {
      conditions.push(eq(recipes.createdBy, filters.createdBy));
    }

    if (!isOwnRecipes) {
      conditions.push(eq(recipes.status, 'published'));
      conditions.push(eq(recipes.visibility, 'public'));
    }

    const searchTerm = filters?.q || filters?.search;
    if (searchTerm) {
      conditions.push(
        or(
          ilike(recipes.title, `%${searchTerm}%`),
          ilike(recipes.description, `%${searchTerm}%`),
        )!,
      );
    }

    if (filters?.difficulty) {
      conditions.push(
        eq(
          recipes.difficulty,
          filters.difficulty as 'easy' | 'medium' | 'hard',
        ),
      );
    }

    if (filters?.tag) {
      conditions.push(sql`${filters.tag} = ANY(${recipes.tags})`);
    }

    const rows = await this.db
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(sql`${recipes.createdAt} desc`);

    return Promise.all(rows.map((row) => this.attachCounts(row)));
  }

  async findById(id: string, viewerUserId?: string) {
    const [recipe] = await this.db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.visibility === 'private' && recipe.createdBy !== viewerUserId) {
      throw new NotFoundException('Recipe not found');
    }

    const recipeIngredients = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, id));

    const recipeSteps = await this.db
      .select()
      .from(steps)
      .where(eq(steps.recipeId, id))
      .orderBy(steps.stepNumber);

    const [author] = await this.db
      .select({
        id: users.id,
        name: users.name,
        profileImage: users.profileImage,
      })
      .from(users)
      .where(eq(users.id, recipe.createdBy))
      .limit(1);

    const [likesResult] = await this.db
      .select({ count: count() })
      .from(recipeLikes)
      .where(eq(recipeLikes.recipeId, id));

    const [commentsResult] = await this.db
      .select({ count: count() })
      .from(recipeComments)
      .where(eq(recipeComments.recipeId, id));

    let likedByViewer = false;
    if (viewerUserId) {
      const [like] = await this.db
        .select({ id: recipeLikes.id })
        .from(recipeLikes)
        .where(
          and(
            eq(recipeLikes.recipeId, id),
            eq(recipeLikes.userId, viewerUserId),
          ),
        )
        .limit(1);
      likedByViewer = !!like;
    }

    const { nutrition, badges } = await this.getHealthInfo(id);
    const imageUrl = await this.getImageUrl(id);

    return {
      ...recipe,
      ingredients: recipeIngredients,
      steps: recipeSteps,
      author: author ?? null,
      likesCount: likesResult?.count ?? 0,
      commentsCount: commentsResult?.count ?? 0,
      likedByViewer,
      nutrition,
      badges,
      imageUrl,
    };
  }

  async translate(id: string, targetLanguage: string, viewerUserId?: string) {
    // Reuses findById so private recipes stay gated to their owner.
    const recipe = await this.findById(id, viewerUserId);

    const [cached] = await this.db
      .select()
      .from(recipeTranslations)
      .where(
        and(
          eq(recipeTranslations.recipeId, id),
          eq(recipeTranslations.language, targetLanguage),
        ),
      )
      .limit(1);

    if (cached) {
      return {
        title: cached.title,
        description: cached.description,
        ingredients: cached.ingredients as { name: string; quantity: string }[],
        steps: cached.steps as { stepNumber: number; instructionText: string }[],
      };
    }

    const translated = await this.aiService.translateRecipe(
      {
        title: recipe.title,
        description: recipe.description ?? undefined,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        cookingTimeMinutes: recipe.cookingTimeMinutes,
        difficulty: recipe.difficulty,
        tags: recipe.tags ?? [],
      },
      targetLanguage,
    );

    await this.db
      .insert(recipeTranslations)
      .values({
        recipeId: id,
        language: targetLanguage,
        title: translated.title,
        description: translated.description,
        ingredients: translated.ingredients,
        steps: translated.steps,
      })
      .onConflictDoNothing();

    return translated;
  }

  async update(id: string, userId: string, dto: UpdateRecipeDto) {
    const [recipe] = await this.db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.createdBy !== userId) {
      throw new ForbiddenException('Not allowed to edit this recipe');
    }

    await this.db
      .update(recipes)
      .set({
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.cookingTimeMinutes !== undefined && {
          cookingTimeMinutes: dto.cookingTimeMinutes,
        }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.language !== undefined && { language: dto.language }),
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id));

    if (dto.ingredients) {
      await this.db.delete(ingredients).where(eq(ingredients.recipeId, id));
      if (dto.ingredients.length > 0) {
        await this.db.insert(ingredients).values(
          dto.ingredients.map((item) => ({
            recipeId: id,
            name: item.name,
            quantity: item.quantity,
          })),
        );
      }
    }

    if (dto.steps) {
      await this.db.delete(steps).where(eq(steps.recipeId, id));
      if (dto.steps.length > 0) {
        await this.db.insert(steps).values(
          dto.steps.map((item) => ({
            recipeId: id,
            stepNumber: item.stepNumber,
            instructionText: item.instructionText,
            audioUrl: item.audioUrl,
          })),
        );
      }
    }

    if (dto.imageUrl) {
      await this.db
        .delete(media)
        .where(and(eq(media.recipeId, id), eq(media.type, 'image')));
      await this.db
        .insert(media)
        .values({ recipeId: id, type: 'image', url: dto.imageUrl });
    }

    const updated = await this.findById(id, userId);

    await this.classifyAndPersistHealth(id, {
      title: updated.title,
      description: updated.description ?? undefined,
      ingredients: updated.ingredients,
      steps: updated.steps,
      cookingTimeMinutes: updated.cookingTimeMinutes,
      difficulty: updated.difficulty,
      tags: updated.tags ?? [],
    });

    return this.findById(id, userId);
  }

  async delete(id: string, userId: string) {
    const [recipe] = await this.db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.createdBy !== userId) {
      throw new ForbiddenException('Not allowed to delete this recipe');
    }

    await this.db.delete(recipes).where(eq(recipes.id, id));
    return { deleted: true };
  }

  async matchByIngredients(inputIngredients: string[]) {
    const normalized = inputIngredients.map((i) => i.toLowerCase().trim());
    const allRecipes = await this.findAll();

    return Promise.all(
      allRecipes.map(async (recipe: RecipeRow & { likesCount?: number }) => {
        const recipeIngredients = await this.db
          .select()
          .from(ingredients)
          .where(eq(ingredients.recipeId, recipe.id));

        const recipeNames = recipeIngredients.map((i: IngredientRow) =>
          (i.normalizedName ?? i.name).toLowerCase(),
        );

        const matched = normalized.filter((input) =>
          recipeNames.some(
            (name: string) => name.includes(input) || input.includes(name),
          ),
        );

        const missing = recipeNames.filter(
          (name: string) =>
            !normalized.some(
              (input) => name.includes(input) || input.includes(name),
            ),
        );

        const matchType =
          missing.length === 0 && matched.length === recipeNames.length
            ? ('exact' as const)
            : matched.length > 0
              ? ('partial' as const)
              : null;

        if (!matchType) return null;

        return {
          recipeId: recipe.id,
          title: recipe.title,
          matchType,
          matchedIngredients: matched,
          missingIngredients: missing,
        };
      }),
    ).then((results) => results.filter(Boolean));
  }

  private async attachCounts(recipe: RecipeRow) {
    const recipeIngredients = await this.db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, recipe.id));

    const recipeSteps = await this.db
      .select()
      .from(steps)
      .where(eq(steps.recipeId, recipe.id))
      .orderBy(steps.stepNumber);

    const [likesResult] = await this.db
      .select({ count: count() })
      .from(recipeLikes)
      .where(eq(recipeLikes.recipeId, recipe.id));

    const [commentsResult] = await this.db
      .select({ count: count() })
      .from(recipeComments)
      .where(eq(recipeComments.recipeId, recipe.id));

    const { nutrition, badges } = await this.getHealthInfo(recipe.id);
    const imageUrl = await this.getImageUrl(recipe.id);

    return {
      ...recipe,
      ingredients: recipeIngredients,
      steps: recipeSteps,
      likesCount: likesResult?.count ?? 0,
      commentsCount: commentsResult?.count ?? 0,
      nutrition,
      badges,
      imageUrl,
    };
  }

  private async getImageUrl(recipeId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ url: media.url })
      .from(media)
      .where(and(eq(media.recipeId, recipeId), eq(media.type, 'image')))
      .orderBy(sql`${media.createdAt} desc`)
      .limit(1);

    return row?.url ?? null;
  }

  private async getHealthInfo(recipeId: string) {
    const [nutritionRow] = await this.db
      .select({
        calories: recipeNutrition.calories,
        proteinG: recipeNutrition.proteinG,
        carbsG: recipeNutrition.carbsG,
        fatG: recipeNutrition.fatG,
      })
      .from(recipeNutrition)
      .where(eq(recipeNutrition.recipeId, recipeId))
      .limit(1);

    const badgeRows = await this.db
      .select({ badge: recipeBadges.badge })
      .from(recipeBadges)
      .where(eq(recipeBadges.recipeId, recipeId));

    return {
      nutrition: nutritionRow ?? null,
      badges: badgeRows.map((row) => row.badge),
    };
  }

  private async classifyAndPersistHealth(
    recipeId: string,
    recipe: StructuredRecipe,
  ) {
    try {
      const classification = await this.aiService.classifyHealth(recipe);
      const badges = sanitizeDietaryBadges(recipe, classification.badges);

      await this.db
        .insert(recipeNutrition)
        .values({ recipeId, ...classification.nutritionEstimate })
        .onConflictDoUpdate({
          target: recipeNutrition.recipeId,
          set: { ...classification.nutritionEstimate },
        });

      await this.db
        .delete(recipeBadges)
        .where(eq(recipeBadges.recipeId, recipeId));

      if (badges.length > 0) {
        await this.db.insert(recipeBadges).values(
          badges.map((badge) => ({
            recipeId,
            badge,
          })),
        );
      }
    } catch (err) {
      this.logger.warn(
        `Health classification failed for recipe ${recipeId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
