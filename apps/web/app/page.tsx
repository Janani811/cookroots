"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function Home() {
  const { t } = useTranslation();

  const features = [
    { title: t("landing.feature1Title"), description: t("landing.feature1Description") },
    { title: t("landing.feature2Title"), description: t("landing.feature2Description") },
    { title: t("landing.feature3Title"), description: t("landing.feature3Description") },
    { title: t("landing.feature4Title"), description: t("landing.feature4Description") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <section className="mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge variant="secondary">{t("landing.badge")}</Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("landing.heading")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{t("landing.subheading")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recipes/new"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {t("landing.createRecipe")}
            </Link>
            <Link
              href="/recipes"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              {t("landing.exploreRecipes")}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="animate-in fade-in slide-in-from-bottom-4 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDuration: "700ms", animationDelay: `${i * 75}ms`, animationFillMode: "both" }}
            >
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
