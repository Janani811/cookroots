import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GroceryItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  quantity?: string;
}

export class CreateGroceryListDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroceryItemDto)
  items!: GroceryItemDto[];
}

export class ToggleGroceryItemDto {
  @IsUUID()
  itemId!: string;

  @IsBoolean()
  isChecked!: boolean;
}

export class CreateFromRecipeDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class RenameGroceryListDto {
  @IsString()
  name!: string;
}

export class AddGroceryItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  quantity?: string;
}
