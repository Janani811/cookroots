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

export default function MatchIngredientsPage() {
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
      setError("Enter at least one ingredient");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.matchIngredients(ingredients);
      setResults(data);
    } catch {
      setError("Failed to search recipes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-3xl font-bold">Find recipes from your ingredients</h1>
        <p className="mb-8 text-muted-foreground">
          Enter what you have in your kitchen — we&apos;ll match community recipes.
        </p>

        <form onSubmit={handleSearch} className="mb-8 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. chicken, rice, garlic, soy sauce"
            className="min-h-32 w-full rounded-md border px-3 py-2 text-sm"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Find recipes"}
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
                          ? "You have everything!"
                          : "Partial match"}
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
                      ✓ Have: {match.matchedIngredients.join(", ")}
                    </p>
                  )}
                  {match.missingIngredients?.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Missing: {match.missingIngredients.join(", ")}
                    </p>
                  )}
                  <Link
                    href={`/recipes/${match.recipeId}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    View recipe
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && input && (
          <p className="text-muted-foreground">
            No matches yet. Try different ingredients or browse all recipes.
          </p>
        )}
      </main>
    </div>
  );
}
