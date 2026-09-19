import type {
  StructuredRecipe,
  RecipeImprovementResult,
  HealthClassification,
  TranslatedRecipeContent,
} from "@repo/types";

import {
  structureRecipePrompt,
  improveRecipePrompt,
  normalizeIngredientsPrompt,
  classifyHealthPrompt,
  transcribeAudioPrompt,
  polishStepPrompt,
  translateRecipePrompt,
} from "./prompts";

import {
  GoogleGenerativeAI,
  GenerativeModel,
} from "@google/generative-ai";

export interface AiClientConfig {
  apiKey: string;
}

function parseJsonFromAi<T>(text: string): T {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fence?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonStr) as T;
}

export class AiClient {
  private model: GenerativeModel;

  constructor(config: AiClientConfig) {
    const genAI = new GoogleGenerativeAI(config.apiKey);

    this.model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });
  }

  async structureRecipe(
    userText: string,
    language?: string
  ): Promise<StructuredRecipe> {
    const result = await this.model.generateContent(
      structureRecipePrompt(userText, language)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    return parseJsonFromAi<StructuredRecipe>(text);
  }

  async improveRecipe(
    recipe: StructuredRecipe,
    language?: string
  ): Promise<RecipeImprovementResult> {
    const result = await this.model.generateContent(
      improveRecipePrompt(recipe, language)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    const parsed = parseJsonFromAi<{
      improved: StructuredRecipe;
      changes: string[];
    }>(text);

    return {
      original: recipe,
      improved: parsed.improved,
      changes: parsed.changes,
    };
  }

  async normalizeIngredients(
    ingredients: string[]
  ): Promise<{ original: string; normalized: string }[]> {
    const result = await this.model.generateContent(
      normalizeIngredientsPrompt(ingredients)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    const parsed = parseJsonFromAi<{ ingredients: { original: string; normalized: string }[] }>(text);

    return parsed.ingredients;
  }

  async transcribeAudio(
    audioBase64: string,
    mimeType: string,
    language?: string
  ): Promise<string> {
    const result = await this.model.generateContent([
      { text: transcribeAudioPrompt(language) },
      { inlineData: { mimeType, data: audioBase64 } },
    ]);

    return result.response.text().trim();
  }

  async polishStep(text: string, language?: string): Promise<string> {
    const result = await this.model.generateContent(
      polishStepPrompt(text, language)
    );

    return result.response.text().trim();
  }

  async translateRecipe(
    recipe: StructuredRecipe,
    targetLanguage: string
  ): Promise<TranslatedRecipeContent> {
    const result = await this.model.generateContent(
      translateRecipePrompt(recipe, targetLanguage)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    return parseJsonFromAi<TranslatedRecipeContent>(text);
  }

  async classifyHealth(recipe: StructuredRecipe): Promise<HealthClassification> {
    const result = await this.model.generateContent(
      classifyHealthPrompt(recipe)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    return parseJsonFromAi<HealthClassification>(text);
  }
}
