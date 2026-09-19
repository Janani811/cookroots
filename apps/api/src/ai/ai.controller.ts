import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { StructuredRecipe } from '@repo/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import {
  ClassifyHealthDto,
  ImproveRecipeDto,
  NormalizeIngredientsDto,
  PolishStepDto,
  StructureRecipeDto,
} from './dto/ai.dto';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('structure')
  structure(@Body() dto: StructureRecipeDto) {
    return this.aiService.structureRecipe(dto.text, dto.language);
  }

  @Post('improve')
  improve(@Body() dto: ImproveRecipeDto) {
    const recipe = JSON.parse(dto.recipeJson) as StructuredRecipe;
    return this.aiService.improveRecipe(recipe, dto.language);
  }

  @Post('normalize-ingredients')
  normalizeIngredients(@Body() dto: NormalizeIngredientsDto) {
    return this.aiService.normalizeIngredients(dto.ingredients);
  }

  @Post('polish-step')
  async polishStep(@Body() dto: PolishStepDto) {
    const text = await this.aiService.polishStep(dto.text, dto.language);
    return { text };
  }

  @Post('classify-health')
  classifyHealth(@Body() dto: ClassifyHealthDto) {
    const recipe: StructuredRecipe = {
      title: dto.title,
      description: dto.description,
      ingredients: dto.ingredients,
      steps: dto.steps,
      cookingTimeMinutes: dto.cookingTimeMinutes ?? null,
      difficulty: dto.difficulty ?? null,
      tags: dto.tags ?? [],
    };
    return this.aiService.classifyHealth(recipe);
  }

  @Post('transcribe')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('audio', { limits: { fileSize: MAX_AUDIO_BYTES } }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');

    const base64 = file.buffer.toString('base64');
    const text = await this.aiService.transcribeAudio(
      base64,
      file.mimetype,
      language,
    );
    return { text };
  }
}
