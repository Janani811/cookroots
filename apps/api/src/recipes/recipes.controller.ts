import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
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
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateRecipeDto, @Req() req: { userId: string }) {
    return this.recipesService.create(dto, req.userId);
  }

  @Get()
  @UseGuards(OptionalAuthGuard)
  findAll(
    @Query() query: SearchRecipesDto,
    @Req() req: { userId?: string },
  ) {
    return this.recipesService.findAll(query, req.userId);
  }

  @Post('match-ingredients')
  matchIngredients(@Body() dto: MatchIngredientsDto) {
    return this.recipesService.matchByIngredients(dto.ingredients);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(@Param() params: RecipeIdParamDto, @Req() req: { userId?: string }) {
    return this.recipesService.findById(params.id, req.userId);
  }

  @Post(':id/translate')
  @UseGuards(OptionalAuthGuard)
  translate(
    @Param() params: RecipeIdParamDto,
    @Body() dto: TranslateRecipeDto,
    @Req() req: { userId?: string },
  ) {
    return this.recipesService.translate(params.id, dto.language, req.userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param() params: RecipeIdParamDto,
    @Body() dto: UpdateRecipeDto,
    @Req() req: { userId: string },
  ) {
    return this.recipesService.update(params.id, req.userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param() params: RecipeIdParamDto, @Req() req: { userId: string }) {
    return this.recipesService.delete(params.id, req.userId);
  }
}
