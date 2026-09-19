import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const ALLOWED_REACTION_EMOJIS = [
  '❤️',
  '😋',
  '🔥',
  '👏',
  '😍',
  '🤤',
] as const;

export type ReactionTargetType = 'comment' | 'recipe_description';

export class RateRecipeDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class CommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class ReactDto {
  @IsIn(['comment', 'recipe_description'])
  targetType!: ReactionTargetType;

  @IsUUID()
  targetId!: string;

  @IsIn(ALLOWED_REACTION_EMOJIS)
  emoji!: string;
}

export class TriedPostDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
