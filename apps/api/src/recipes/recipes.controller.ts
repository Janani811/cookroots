import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import {
  CreateRecipeDto,
  MatchIngredientsDto,
  RecipeIdParamDto,
  SearchRecipesDto,
  TranslateRecipeDto,
  UpdateRecipeDto,
} from './dto/recipes.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateRecipeDto, @CurrentUser() userId: string) {
    return this.recipesService.create(dto, userId);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  findAll(@Query() query: SearchRecipesDto, @CurrentUser() userId?: string) {
    return this.recipesService.findAll(query, userId);
  }

  @Post('match-ingredients')
  matchIngredients(@Body() dto: MatchIngredientsDto) {
    return this.recipesService.matchByIngredients(dto.ingredients);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(@Param() params: RecipeIdParamDto, @CurrentUser() userId?: string) {
    return this.recipesService.findById(params.id, userId);
  }

  @Post(':id/translate')
  @UseGuards(OptionalAuthGuard)
  translate(
    @Param() params: RecipeIdParamDto,
    @Body() dto: TranslateRecipeDto,
    @CurrentUser() userId?: string,
  ) {
    return this.recipesService.translate(params.id, dto.language, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param() params: RecipeIdParamDto,
    @Body() dto: UpdateRecipeDto,
    @CurrentUser() userId: string,
  ) {
    return this.recipesService.update(params.id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param() params: RecipeIdParamDto, @CurrentUser() userId: string) {
    return this.recipesService.delete(params.id, userId);
  }
}
