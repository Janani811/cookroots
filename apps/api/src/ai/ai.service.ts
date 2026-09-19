import { Injectable } from '@nestjs/common';
import { AiClient } from '@repo/ai';
import type { StructuredRecipe } from '@repo/types';

@Injectable()
export class AiService {
  constructor(private readonly aiClient: AiClient) {}

  structureRecipe(text: string, language?: string) {
    return this.aiClient.structureRecipe(text, language);
  }

  improveRecipe(recipe: StructuredRecipe, language?: string) {
    return this.aiClient.improveRecipe(recipe, language);
  }

  normalizeIngredients(ingredients: string[]) {
    return this.aiClient.normalizeIngredients(ingredients);
  }

  classifyHealth(recipe: StructuredRecipe) {
    return this.aiClient.classifyHealth(recipe);
  }

  transcribeAudio(audioBase64: string, mimeType: string, language?: string) {
    return this.aiClient.transcribeAudio(audioBase64, mimeType, language);
  }

  polishStep(text: string, language?: string) {
    return this.aiClient.polishStep(text, language);
  }

  translateRecipe(recipe: StructuredRecipe, targetLanguage: string) {
    return this.aiClient.translateRecipe(recipe, targetLanguage);
  }
}
