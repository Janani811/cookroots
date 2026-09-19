"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { healthBadgeLabel } from "@/lib/health-badges";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export type RecipeCardData = {
  id: string;
  title: string;
  description?: string | null;
  difficulty?: string | null;
  cookingTimeMinutes?: number | null;
  ingredients?: unknown[];
  steps?: unknown[];
  likesCount?: number;
  tags?: string[];
  badges?: string[];
  imageUrl?: string | null;
  visibility?: string | null;
};

export function RecipeCard({
  recipe,
  footer,
}: {
  recipe: RecipeCardData;
  /** Optional footer actions (e.g. View/Edit links). When omitted, the whole card links to the recipe. */
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const content = (
    <>
      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover/card:scale-105"
        />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2 transition-colors group-hover/card:text-primary">
          {recipe.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {recipe.description || t("common.noDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
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
          {recipe.badges?.map((badge) => (
            <Badge key={badge} variant="secondary">
              {healthBadgeLabel(badge)}
            </Badge>
          ))}
          {recipe.visibility === "private" && (
            <Badge variant="outline">🔒 {t("common.private")}</Badge>
          )}
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {recipe.cookingTimeMinutes ? (
            <p>⏱️ {t("common.minsCount", { count: recipe.cookingTimeMinutes })}</p>
          ) : null}
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <p>🥘 {t("common.ingredientsCount", { count: recipe.ingredients.length })}</p>
          ) : null}
          {recipe.steps && recipe.steps.length > 0 ? (
            <p>📋 {t("common.stepsCount", { count: recipe.steps.length })}</p>
          ) : null}
          {recipe.likesCount ? (
            <p>❤️ {t("common.likesCount", { count: recipe.likesCount })}</p>
          ) : null}
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </>
  );

  if (footer) {
    return (
      <Card className="h-full transition-shadow hover:shadow-lg">
        {content}
        <CardFooter className="gap-2">{footer}</CardFooter>
      </Card>
    );
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
        {content}
      </Card>
    </Link>
  );
}
