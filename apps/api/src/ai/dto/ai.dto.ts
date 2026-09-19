import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientDto, StepDto } from '../../recipes/dto/recipes.dto';

const LANGUAGE_OPTIONS = [
  'auto',
  'en',
  'de',
  'ja',
  'fr',
  'ta',
  'te',
  'hi',
  'ml',
  'es',
  'pa',
] as const;

export class StructureRecipeDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  @IsIn(LANGUAGE_OPTIONS)
  language?: string;
}

export class ImproveRecipeDto {
  @IsString()
  recipeJson!: string;

  @IsOptional()
  @IsString()
  @IsIn(LANGUAGE_OPTIONS)
  language?: string;
}

export class NormalizeIngredientsDto {
  @IsString({ each: true })
  ingredients!: string[];
}

export class PolishStepDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  @IsIn(LANGUAGE_OPTIONS)
  language?: string;
}

export class ClassifyHealthDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients!: IngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  steps!: StepDto[];

  @IsOptional()
  @IsInt()
  cookingTimeMinutes?: number;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
