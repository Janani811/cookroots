"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function MatchIngredientsPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const ingredients = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      setError(t("recipeMatch.enterAtLeastOne"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.matchIngredients(ingredients);
      setResults(data);
    } catch {
      setError(t("recipeMatch.searchFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-2 text-3xl font-bold">{t("recipeMatch.title")}</h1>
        <p className="mb-8 text-muted-foreground">{t("recipeMatch.subtitle")}</p>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("recipeMatch.inputPlaceholder")}
            className="min-h-32 w-full rounded-md border px-3 py-2 text-sm"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? t("recipeMatch.searching") : t("recipeMatch.findRecipes")}
          </Button>
        </form>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((match) => (
              <Card key={match.recipeId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{match.title}</CardTitle>
                      <CardDescription>
                        {match.matchType === "exact"
                          ? t("recipeMatch.haveEverything")
                          : t("recipeMatch.partialMatch")}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        match.matchType === "exact" ? "default" : "secondary"
                      }
                    >
                      {match.matchType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {match.matchedIngredients?.length > 0 && (
                    <p className="text-sm">
                      ✓ {t("recipeMatch.have")}: {match.matchedIngredients.join(", ")}
                    </p>
                  )}
                  {match.missingIngredients?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("recipeMatch.missing")}: {match.missingIngredients.join(", ")}
                    </p>
                  )}
                  <Link
                    href={`/recipes/${match.recipeId}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    {t("recipeMatch.viewRecipe")}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && input && (
          <p className="text-muted-foreground">{t("recipeMatch.noMatchesYet")}</p>
        )}
      </main>
    </div>
  );
}
