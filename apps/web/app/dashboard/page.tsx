"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getRecipes({ createdBy: user.id })
      .then((recipes) => {
        const list = Array.isArray(recipes) ? recipes : [];
        setUserRecipes(list);
        setStats({
          totalRecipes: list.length,
          totalLikes: list.reduce(
            (sum, r) => sum + (r.likesCount || 0),
            0
          ),
          totalComments: list.reduce(
            (sum, r) => sum + (r.commentsCount || 0),
            0
          ),
        });
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your recipes and track your community engagement
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Recipes</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalRecipes}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Likes</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalLikes}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Comments</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalComments}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Recipes</CardTitle>
              <CardDescription>
                Manage and edit your published recipes
              </CardDescription>
            </div>
            <Link href="/recipes/new" className={cn(buttonVariants())}>
              New Recipe
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : userRecipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created any recipes yet
                </p>
                <Link href="/recipes/new" className={cn(buttonVariants())}>
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{recipe.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {recipe.ingredients?.length || 0} ingredients •{" "}
                        {recipe.steps?.length || 0} steps
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="font-semibold">❤️ {recipe.likesCount || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" })
                          )}
                        >
                          View
                        </Link>
                        <Link
                          href={`/recipes/${recipe.id}/edit`}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
