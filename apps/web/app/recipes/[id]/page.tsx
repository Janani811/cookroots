"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/star-rating";
import { EmojiReactions } from "@/components/emoji-reactions";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import { CommentThread, type CommentData } from "@/components/comment-thread";
import { healthBadgeLabel } from "@/lib/health-badges";
import { cn } from "@/lib/utils";
import {
  api,
  speakText,
  type ReactionSummary,
  type TranslatedRecipeContent,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { RECIPE_LANGUAGES } from "@/lib/languages";
import { useTranslation } from "@/lib/i18n/i18n-provider";

function updateReactionList(
  reactions: ReactionSummary[],
  emoji: string,
  wasReacted: boolean
): ReactionSummary[] {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) {
    return wasReacted
      ? reactions
      : [...reactions, { emoji, count: 1, reactedByViewer: true }];
  }

  const nextCount = existing.count + (wasReacted ? -1 : 1);
  if (nextCount <= 0) {
    return reactions.filter((r) => r.emoji !== emoji);
  }
  return reactions.map((r) =>
    r.emoji === emoji ? { ...r, count: nextCount, reactedByViewer: !wasReacted } : r
  );
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [playingStepIndex, setPlayingStepIndex] = useState<number | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [translation, setTranslation] = useState<TranslatedRecipeContent | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateMenuOpen, setTranslateMenuOpen] = useState(false);
  const translateMenuRef = useRef<HTMLDivElement>(null);
  const [myRating, setMyRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [addingToGrocery, setAddingToGrocery] = useState(false);
  const isOwner = Boolean(user && recipe?.createdBy === user.id);
  const [groceryDialogOpen, setGroceryDialogOpen] = useState(false);
  const [groceryListName, setGroceryListName] = useState("");
  const [triedOpen, setTriedOpen] = useState(false);
  const [triedRating, setTriedRating] = useState(0);
  const [triedComment, setTriedComment] = useState("");
  const [triedImageUrl, setTriedImageUrl] = useState<string | null>(null);
  const [uploadingTriedImage, setUploadingTriedImage] = useState(false);
  const [submittingTried, setSubmittingTried] = useState(false);
  const [descriptionReactions, setDescriptionReactions] = useState<ReactionSummary[]>([]);

  useEffect(() => {
    loadRecipe();
    loadComments();
    loadReactions();
  }, [id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (translateMenuRef.current && !translateMenuRef.current.contains(event.target as Node)) {
        setTranslateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadRecipe() {
    try {
      setLoading(true);
      const data = await api.getRecipe(id);
      setRecipe(data);
      setLiked(!!data.likedByViewer);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("recipeDetail.loadFailed"));
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

  async function loadReactions() {
    try {
      const data = await api.getReactions(id);
      setDescriptionReactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reactions", err);
    }
  }

  async function handleReact(
    targetType: "comment" | "recipe_description",
    targetId: string,
    emoji: string,
    reactedByViewer: boolean
  ) {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (reactedByViewer) {
        await api.removeReaction(id, targetType, targetId, emoji);
      } else {
        await api.addReaction(id, targetType, targetId, emoji);
      }

      if (targetType === "recipe_description") {
        setDescriptionReactions((prev) => updateReactionList(prev, emoji, reactedByViewer));
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === targetId
              ? { ...c, reactions: updateReactionList(c.reactions ?? [], emoji, reactedByViewer) }
              : c
          )
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.reactionFailed"));
    }
  }

  async function handleLikeComment(commentId: string, liked: boolean) {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (liked) {
        await api.unlikeComment(id, commentId);
      } else {
        await api.likeComment(id, commentId);
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likedByViewer: !liked,
                likesCount: Math.max(0, (c.likesCount || 0) + (liked ? -1 : 1)),
              }
            : c
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.commentLikeFailed"));
    }
  }

  async function handleSubmitReply(parentCommentId: string, text: string) {
    try {
      const newReply = await api.addComment(id, text, parentCommentId);
      setComments((prev) => [newReply, ...prev]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.commentFailed"));
    }
  }

  async function handleLike() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isOwner) {
      toast.error(t("recipeDetail.cannotLikeOwn"));
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
      toast.error(err instanceof Error ? err.message : t("recipeDetail.likeFailed"));
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
      toast.error(err instanceof Error ? err.message : t("recipeDetail.commentFailed"));
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleRate(rating: number) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isOwner) {
      toast.error(t("recipeDetail.cannotRateOwn"));
      return;
    }

    const previous = myRating;
    setMyRating(rating);
    setSubmittingRating(true);
    try {
      await api.rateRecipe(id, rating);
      toast.success(t("recipeDetail.ratingThanks"));
    } catch (err) {
      setMyRating(previous);
      toast.error(err instanceof Error ? err.message : t("recipeDetail.ratingFailed"));
    } finally {
      setSubmittingRating(false);
    }
  }

  function openGroceryDialog() {
    if (!user) {
      router.push("/login");
      return;
    }
    setGroceryListName(t("recipeDetail.groceryListNameDefault", { title: recipe.title }));
    setGroceryDialogOpen(true);
  }

  async function handleAddToGrocery(e: React.FormEvent) {
    e.preventDefault();

    setAddingToGrocery(true);
    try {
      const [list] = await api.createGroceryList([id], groceryListName.trim() || undefined);
      toast.success(t("recipeDetail.addedToGroceryToast"));
      setGroceryDialogOpen(false);
      if (list) router.push(`/grocery/${list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.createGroceryListFailed"));
    } finally {
      setAddingToGrocery(false);
    }
  }

  async function handleTriedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingTriedImage(true);
    try {
      const { url } = await api.uploadFile(file);
      setTriedImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.uploadPhotoFailed"));
    } finally {
      setUploadingTriedImage(false);
    }
  }

  async function handleSubmitTried(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setSubmittingTried(true);
    try {
      await api.tryRecipe(id, {
        comment: triedComment.trim() || undefined,
        rating: triedRating || undefined,
        imageUrl: triedImageUrl ?? undefined,
      });
      toast.success(t("recipeDetail.markedAsTriedToast"));
      setTriedOpen(false);
      setTriedComment("");
      setTriedRating(0);
      setTriedImageUrl(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.saveFailed"));
    } finally {
      setSubmittingTried(false);
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

  async function handleTranslate(lang: string) {
    setTranslateMenuOpen(false);
    setTranslating(true);
    try {
      const result = await api.translateRecipe(id, lang);
      setTranslation(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("recipeDetail.translateFailed"));
    } finally {
      setTranslating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("recipeDetail.loadingRecipe")}</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-destructive">{error || t("recipeDetail.recipeNotFound")}</p>
          <Link href="/recipes" className={cn(buttonVariants())}>
            {t("recipeDetail.backToRecipes")}
          </Link>
        </div>
      </div>
    );
  }

  const displayIngredients = translation?.ingredients ?? recipe.ingredients;
  const displaySteps = translation?.steps ?? recipe.steps;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-8 lg:px-12">
        {recipe.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full aspect-video object-cover rounded-xl mb-6"
          />
        )}

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {translation?.title ?? recipe.title}
              </h1>
              {(translation?.description ?? recipe.description) && (
                <p className="text-lg text-muted-foreground">
                  {translation?.description ?? recipe.description}
                </p>
              )}
              <div className="mt-3">
                <EmojiReactions
                  reactions={descriptionReactions}
                  onToggle={(emoji, reactedByViewer) =>
                    handleReact("recipe_description", id, emoji, reactedByViewer)
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative" ref={translateMenuRef}>
                <Button
                  variant="outline"
                  onClick={() => setTranslateMenuOpen((v) => !v)}
                  disabled={translating}
                  className="w-full sm:w-auto"
                >
                  <Languages className="size-4" />
                  {translating
                    ? t("recipeDetail.translating")
                    : translation
                      ? t("recipeDetail.translated")
                      : t("recipeDetail.translate")}
                </Button>
                {translateMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                    {translation && (
                      <button
                        type="button"
                        onClick={() => {
                          setTranslation(null);
                          setTranslateMenuOpen(false);
                        }}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        {t("recipeDetail.showOriginal")}
                      </button>
                    )}
                    {Object.values(RECIPE_LANGUAGES).map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleTranslate(lang.code)}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        {lang.name} ({lang.nativeName})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant={liked ? "default" : "outline"}
                onClick={handleLike}
                disabled={isOwner}
                title={isOwner ? t("recipeDetail.cannotLikeOwn") : undefined}
                className="w-full sm:w-auto"
              >
                <span className={liked ? "inline-block animate-in zoom-in-50 duration-300" : "inline-block"}>
                  ❤️
                </span>{" "}
                {recipe.likesCount || 0}
              </Button>
            </div>
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
                {t(`recipesList.${recipe.difficulty}`)}
              </Badge>
            )}
            {recipe.badges?.map((badge: string) => (
              <Badge key={badge} variant="secondary">
                {healthBadgeLabel(badge)}
              </Badge>
            ))}
            {recipe.visibility === "private" && (
              <Badge variant="outline">🔒 {t("common.private")}</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("recipeNew.ingredientsLabel")}</CardTitle>
              </CardHeader>
              <CardContent>
                {displayIngredients && displayIngredients.length > 0 ? (
                  <ul className="space-y-2">
                    {displayIngredients.map(
                      (ingredient: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 pb-2 border-b last:border-0"
                        >
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={!!checkedIngredients[index]}
                            onChange={(e) =>
                              setCheckedIngredients((prev) => ({
                                ...prev,
                                [index]: e.target.checked,
                              }))
                            }
                          />
                          <span
                            className={
                              checkedIngredients[index]
                                ? "line-through text-muted-foreground"
                                : undefined
                            }
                          >
                            {ingredient.quantity} {ingredient.name}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{t("recipeDetail.noIngredients")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("recipeDetail.instructions")}</CardTitle>
              </CardHeader>
              <CardContent>
                {displaySteps && displaySteps.length > 0 ? (
                  <div className="space-y-4">
                    {displaySteps.map((step: any, index: number) => (
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
                            {playingStepIndex === index
                              ? t("recipeDetail.playing")
                              : t("recipeDetail.listen")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t("recipeDetail.noInstructions")}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("recipeDetail.commentsCount", {
                    count: comments.filter((c) => !c.parentCommentId).length,
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <div className="relative">
                    <textarea
                      placeholder={
                        user
                          ? t("recipeDetail.commentPlaceholder")
                          : t("recipeDetail.commentPlaceholderLoggedOut")
                      }
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={!user}
                      className="w-full rounded-md border border-input px-3 py-2 pr-11 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-24"
                    />
                    {user && (
                      <EmojiPickerButton
                        className="absolute bottom-2 right-2"
                        onSelect={(emoji) => setCommentText((prev) => prev + emoji)}
                      />
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={submittingComment || !commentText.trim() || !user}
                  >
                    {submittingComment ? t("recipeDetail.posting") : t("recipeDetail.postComment")}
                  </Button>
                </form>

                {comments.filter((c) => !c.parentCommentId).length > 0 ? (
                  <div className="space-y-4">
                    {comments
                      .filter((c) => !c.parentCommentId)
                      .map((comment) => (
                        <CommentThread
                          key={comment.id}
                          comment={comment as CommentData}
                          replies={
                            comments.filter(
                              (c) => c.parentCommentId === comment.id
                            ) as CommentData[]
                          }
                          isLoggedIn={!!user}
                          onLike={handleLikeComment}
                          onReact={(commentId, emoji, reactedByViewer) =>
                            handleReact("comment", commentId, emoji, reactedByViewer)
                          }
                          onSubmitReply={handleSubmitReply}
                          t={t}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("recipeDetail.noComments")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {recipe.cookingTimeMinutes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("recipeDetail.cookingTime")}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {t("common.minsCount", { count: recipe.cookingTimeMinutes })}
                </CardContent>
              </Card>
            )}

            {recipe.nutrition && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("recipeDetail.nutritionTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
                  {recipe.nutrition.calories != null && (
                    <>
                      <span className="text-muted-foreground">{t("recipeDetail.calories")}</span>
                      <span className="font-medium text-right">{recipe.nutrition.calories} kcal</span>
                    </>
                  )}
                  {recipe.nutrition.proteinG != null && (
                    <>
                      <span className="text-muted-foreground">{t("recipeDetail.protein")}</span>
                      <span className="font-medium text-right">{recipe.nutrition.proteinG} g</span>
                    </>
                  )}
                  {recipe.nutrition.carbsG != null && (
                    <>
                      <span className="text-muted-foreground">{t("recipeDetail.carbs")}</span>
                      <span className="font-medium text-right">{recipe.nutrition.carbsG} g</span>
                    </>
                  )}
                  {recipe.nutrition.fatG != null && (
                    <>
                      <span className="text-muted-foreground">{t("recipeDetail.fat")}</span>
                      <span className="font-medium text-right">{recipe.nutrition.fatG} g</span>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("recipeNew.tagsLabel")}</CardTitle>
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
                  <CardTitle className="text-base">{t("recipeDetail.recipeBy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{recipe.author.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {!isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("recipeDetail.rateThisRecipe")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <StarRating value={myRating} onChange={handleRate} disabled={submittingRating} />
                </CardContent>
              </Card>
            )}

            <Link
              href={`/recipes/${id}/cook`}
              className={cn(buttonVariants(), "w-full inline-flex justify-center")}
            >
              👨‍🍳 {t("recipeDetail.startCookingMode")}
            </Link>

            <Button variant="outline" className="w-full" onClick={openGroceryDialog}>
              🛒 {t("recipeDetail.addToGroceryList")}
            </Button>

            <Dialog open={groceryDialogOpen} onOpenChange={setGroceryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("recipeDetail.addToGroceryListDialogTitle")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddToGrocery} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">{t("recipeDetail.listName")}</p>
                    <Input
                      value={groceryListName}
                      onChange={(e) => setGroceryListName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addingToGrocery}>
                      {addingToGrocery ? t("recipeDetail.adding") : t("recipeDetail.createList")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={triedOpen} onOpenChange={setTriedOpen}>
              <DialogTrigger
                render={<Button variant="outline" className="w-full" />}
              >
                📸 {t("recipeDetail.markAsTried")}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("recipeDetail.markAsTriedDialogTitle")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitTried} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">{t("recipeDetail.photoLabel")}</p>
                    {triedImageUrl ? (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={triedImageUrl}
                          alt="Your cooking result"
                          className="w-full rounded-lg border object-cover aspect-video"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setTriedImageUrl(null)}
                        >
                          {t("recipeNew.removePhoto")}
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer inline-block">
                        <span className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                          {uploadingTriedImage
                            ? t("recipeNew.uploadingPhoto")
                            : t("recipeNew.addPhoto")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingTriedImage}
                          onChange={handleTriedImageUpload}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{t("recipeDetail.ratingLabel")}</p>
                    <StarRating value={triedRating} onChange={setTriedRating} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{t("recipeDetail.commentLabel")}</p>
                    <Textarea
                      value={triedComment}
                      onChange={(e) => setTriedComment(e.target.value)}
                      placeholder={t("recipeDetail.triedCommentPlaceholder")}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={submittingTried}>
                      {submittingTried ? t("recipeDetail.saving") : t("common.save")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {user && recipe.createdBy === user.id && (
              <Link
                href={`/recipes/${id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full inline-flex justify-center"
                )}
              >
                {t("recipeDetail.editRecipe")}
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
