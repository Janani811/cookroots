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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { RecipeCard } from "@/components/recipe-card";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [visibilityTab, setVisibilityTab] = useState<"all" | "public" | "private">("all");
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

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("dashboard.yourDashboard")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.totalRecipes")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalRecipes}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.totalLikes")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalLikes}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.totalComments")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.totalComments}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.yourRecipes")}</CardTitle>
              <CardDescription>{t("dashboard.manageAndEdit")}</CardDescription>
            </div>
            <Link href="/recipes/new" className={cn(buttonVariants())}>
              {t("dashboard.newRecipe")}
            </Link>
          </CardHeader>
          <CardContent>
            {userRecipes.length > 0 && (
              <div className="mb-4 inline-flex rounded-lg border border-border p-1">
                {(["all", "public", "private"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setVisibilityTab(tab)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      visibilityTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(`dashboard.${tab}Tab`)}
                  </button>
                ))}
              </div>
            )}
            {loading ? (
              <p className="text-muted-foreground">{t("common.loading")}</p>
            ) : userRecipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t("dashboard.noRecipesYet")}</p>
                <Link href="/recipes/new" className={cn(buttonVariants())}>
                  {t("dashboard.createFirstRecipe")}
                </Link>
              </div>
            ) : (() => {
              const filteredRecipes =
                visibilityTab === "all"
                  ? userRecipes
                  : userRecipes.filter((r) => r.visibility === visibilityTab);

              if (filteredRecipes.length === 0) {
                return (
                  <p className="text-muted-foreground text-center py-8">
                    {t(
                      visibilityTab === "public"
                        ? "dashboard.noPublicRecipes"
                        : "dashboard.noPrivateRecipes"
                    )}
                  </p>
                );
              }

              return (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    footer={
                      <>
                        <Link
                          href={`/recipes/${recipe.id}`}
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" })
                          )}
                        >
                          {t("dashboard.view")}
                        </Link>
                        <Link
                          href={`/recipes/${recipe.id}/edit`}
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                        >
                          {t("dashboard.edit")}
                        </Link>
                      </>
                    }
                  />
                ))}
              </div>
              );
            })()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
