"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api, speakText } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [playingStepIndex, setPlayingStepIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRecipe();
    loadComments();
  }, [id]);

  async function loadRecipe() {
    try {
      setLoading(true);
      const data = await api.getRecipe(id);
      setRecipe(data);
      setLiked(!!data.likedByViewer);
      setError("");
    } catch (err) {
      setError("Failed to load recipe");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const data = await api.getComments(id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  }

  async function handleLike() {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (liked) {
        await api.unlikeRecipe(id);
        setLiked(false);
        setRecipe((prev: any) => ({
          ...prev,
          likesCount: Math.max(0, (prev?.likesCount || 0) - 1),
        }));
      } else {
        await api.likeRecipe(id);
        setLiked(true);
        setRecipe((prev: any) => ({
          ...prev,
          likesCount: (prev?.likesCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Failed to like recipe", err);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setSubmittingComment(true);
      const newComment = await api.addComment(id, commentText);
      setComments([newComment, ...comments]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment", err);
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  function playStepAudio(step: any, index: number) {
    setPlayingStepIndex(index);
    const utterance = speakText(step.instructionText, recipe?.language);
    if (utterance) {
      utterance.onend = () => setPlayingStepIndex(null);
      utterance.onerror = () => setPlayingStepIndex(null);
    } else {
      setPlayingStepIndex(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-destructive">{error || "Recipe not found"}</p>
          <Link href="/recipes" className={cn(buttonVariants())}>
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-muted-foreground">
                  {recipe.description}
                </p>
              )}
            </div>
            <Button
              variant={liked ? "default" : "outline"}
              onClick={handleLike}
              className="w-full sm:w-auto"
            >
              ❤️ {recipe.likesCount || 0}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
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
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  <ul className="space-y-2">
                    {recipe.ingredients.map(
                      (ingredient: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 pb-2 border-b last:border-0"
                        >
                          <input type="checkbox" className="rounded" />
                          <span>
                            {ingredient.quantity} {ingredient.name}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No ingredients</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                {recipe.steps && recipe.steps.length > 0 ? (
                  <div className="space-y-4">
                    {recipe.steps.map((step: any, index: number) => (
                      <div
                        key={index}
                        className="flex gap-4 pb-4 border-b last:border-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                            {step.stepNumber || index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-base">{step.instructionText}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playStepAudio(step, index)}
                            disabled={playingStepIndex === index}
                            className="mt-2"
                          >
                            {playingStepIndex === index ? "🔊 Playing..." : "🔊 Listen"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No instructions</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    placeholder={
                      user
                        ? "Share your thoughts about this recipe..."
                        : "Log in to comment..."
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={!user}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                  />
                  <Button
                    type="submit"
                    disabled={submittingComment || !commentText.trim() || !user}
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </form>

                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-t pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">
                              {comment.user?.name || "Anonymous"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">
                          {comment.text || comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No comments yet. Be the first!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {recipe.cookingTimeMinutes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cooking Time</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {recipe.cookingTimeMinutes} mins
                </CardContent>
              </Card>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {recipe.author && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recipe by</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{recipe.author.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            <Link
              href={`/recipes/${id}/cook`}
              className={cn(buttonVariants(), "w-full inline-flex justify-center")}
            >
              👨‍🍳 Start Cooking Mode
            </Link>

            {user && recipe.createdBy === user.id && (
              <Link
                href={`/recipes/${id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full inline-flex justify-center"
                )}
              >
                Edit recipe
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
