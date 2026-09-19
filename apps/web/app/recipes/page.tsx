"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { RecipeCard } from "@/components/recipe-card";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function RecipesPage() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecipes();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, difficulty]);

  async function loadRecipes() {
    try {
      setLoading(true);
      const data = await api.getRecipes({
        search: search || undefined,
        difficulty: difficulty || undefined,
      });
      setRecipes(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("recipesList.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold">{t("recipesList.exploreRecipes")}</h1>

          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder={t("recipesList.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t("recipesList.allDifficulties")}</option>
              <option value="easy">{t("recipesList.easy")}</option>
              <option value="medium">{t("recipesList.medium")}</option>
              <option value="hard">{t("recipesList.hard")}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-muted-foreground">
            {t("recipesList.loadingRecipes")}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("recipesList.noRecipesFound")}</p>
            <Link href="/recipes/new" className={cn(buttonVariants())}>
              {t("recipesList.createRecipe")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
