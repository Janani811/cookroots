import type {
  StructuredRecipe,
  RecipeImprovementResult,
} from "@repo/types";

import {
  structureRecipePrompt,
  improveRecipePrompt,
  normalizeIngredientsPrompt,
  classifyHealthPrompt,
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

  async classifyHealth(recipe: StructuredRecipe) {
    const result = await this.model.generateContent(
      classifyHealthPrompt(recipe)
    );

    const text = result.response.text();
    if (!text) throw new Error("Empty AI response");

    return parseJsonFromAi(text);
  }
}
