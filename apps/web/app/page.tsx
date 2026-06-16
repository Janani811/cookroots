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

const features = [
  {
    title: "Voice-first recipes",
    description: "Record messy instructions — AI turns them into clear steps.",
  },
  {
    title: "AI structuring",
    description: "Ingredients, steps, timing, and tags — auto-formatted.",
  },
  {
    title: "Cooking mode",
    description: "Hands-free step playback with TTS while you cook.",
  },
  {
    title: "Ingredient match",
    description: "Find recipes from what you already have in the kitchen.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="mb-16 space-y-6">
          <Badge variant="secondary">AI + Voice + Community</Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Turn messy cooking notes into recipes you can actually follow.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Speak, type, or paste instructions. Cooksy structures them with AI,
            then guides you hands-free in cooking mode.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recipes/new"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Create a recipe
            </Link>
            <Link
              href="/recipes"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Explore recipes
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
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
