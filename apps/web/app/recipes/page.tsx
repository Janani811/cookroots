"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";

export default function RecipesPage() {
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
      setError("Failed to load recipes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-6 text-3xl font-bold">Explore Recipes</h1>

          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Search recipes by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
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
            Loading recipes...
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No recipes found. Why not create one?
            </p>
            <Link href="/recipes/new" className={cn(buttonVariants())}>
              Create Recipe
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {recipe.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {recipe.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {recipe.difficulty && (
                        <Badge
                          variant={
                            recipe.difficulty === "hard"
                              ? "destructive"
                              : recipe.difficulty === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {recipe.difficulty}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {recipe.cookingTimeMinutes && (
                        <p>⏱️ {recipe.cookingTimeMinutes} mins</p>
                      )}
                      {recipe.ingredients?.length > 0 && (
                        <p>🥘 {recipe.ingredients.length} ingredients</p>
                      )}
                      {recipe.steps?.length > 0 && (
                        <p>📋 {recipe.steps.length} steps</p>
                      )}
                      {recipe.likesCount > 0 && (
                        <p>❤️ {recipe.likesCount} likes</p>
                      )}
                    </div>

                    {recipe.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {recipe.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
