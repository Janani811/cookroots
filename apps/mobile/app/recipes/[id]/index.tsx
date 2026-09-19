import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, View } from "react-native";
import { ImagePickerField } from "@/components/ImagePickerField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { StarRating } from "@/components/ui/StarRating";
import { EmojiReactions } from "@/components/EmojiReactions";
import { EmojiPickerButton } from "@/components/EmojiPickerButton";
import { CommentThread, type CommentData } from "@/components/CommentThread";
import { api, type ReactionSummary, type TranslatedRecipeContent } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { RECIPE_LANGUAGES } from "@/lib/languages";

function StatBlock({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl">{emoji}</Text>
      <Text className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{value}</Text>
      <Text className="text-xs text-neutral-600 dark:text-neutral-400">{label}</Text>
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [triedOpen, setTriedOpen] = useState(false);
  const [triedRating, setTriedRating] = useState(0);
  const [triedComment, setTriedComment] = useState("");
  const [triedImageUrl, setTriedImageUrl] = useState<string | null>(null);
  const [submittingTried, setSubmittingTried] = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [groceryListName, setGroceryListName] = useState("");
  const [addingToGrocery, setAddingToGrocery] = useState(false);
  const [translation, setTranslation] = useState<TranslatedRecipeContent | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [descriptionReactions, setDescriptionReactions] = useState<ReactionSummary[]>([]);

  const isOwner = Boolean(user && recipe?.createdBy === user.id);
  const displayTitle = translation?.title ?? recipe?.title;
  const displayDescription = translation?.description ?? recipe?.description;
  const displayIngredients = translation?.ingredients ?? recipe?.ingredients;
  const displaySteps = translation?.steps ?? recipe?.steps;

  useEffect(() => {
    if (!id) return;
    loadRecipe();
    loadComments();
    api
      .getReactions(id)
      .then((data) => setDescriptionReactions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  function loadComments() {
    return api
      .getComments(id)
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  function loadRecipe() {
    setLoading(true);
    return api
      .getRecipe(id)
      .then((data) => {
        setRecipe(data);
        setLiked(!!data.likedByViewer);
      })
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }

  async function handleLike() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (isOwner) {
      alert("You cannot like your own recipe");
      return;
    }
    try {
      if (liked) {
        await api.unlikeRecipe(id);
        setLiked(false);
        setRecipe((prev: any) => ({ ...prev, likesCount: Math.max(0, (prev?.likesCount || 0) - 1) }));
      } else {
        await api.likeRecipe(id);
        setLiked(true);
        setRecipe((prev: any) => ({ ...prev, likesCount: (prev?.likesCount || 0) + 1 }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to like recipe");
    }
  }

  async function handleRate(rating: number) {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (isOwner) {
      alert("You cannot rate your own recipe");
      return;
    }
    const previous = myRating;
    setMyRating(rating);
    try {
      await api.rateRecipe(id, rating);
    } catch (err) {
      setMyRating(previous);
      alert(err instanceof Error ? err.message : "Failed to submit rating");
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    setSubmittingComment(true);
    try {
      const newComment = await api.addComment(id, commentText);
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleSubmitReply(parentCommentId: string, text: string) {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    try {
      const newReply = await api.addComment(id, text, parentCommentId);
      setComments((prev) => [newReply, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add reply");
    }
  }

  async function handleLikeComment(commentId: string, liked: boolean) {
    if (!user) {
      router.push("/(auth)/login");
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
      alert(err instanceof Error ? err.message : "Failed to like comment");
    }
  }

  function updateReactionList(
    reactions: ReactionSummary[],
    emoji: string,
    wasReacted: boolean
  ): ReactionSummary[] {
    const existing = reactions.find((r) => r.emoji === emoji);
    if (!existing) {
      return wasReacted ? reactions : [...reactions, { emoji, count: 1, reactedByViewer: true }];
    }
    const nextCount = existing.count + (wasReacted ? -1 : 1);
    if (nextCount <= 0) return reactions.filter((r) => r.emoji !== emoji);
    return reactions.map((r) =>
      r.emoji === emoji ? { ...r, count: nextCount, reactedByViewer: !wasReacted } : r
    );
  }

  async function handleReact(
    targetType: "comment" | "recipe_description",
    targetId: string,
    emoji: string,
    reactedByViewer: boolean
  ) {
    if (!user) {
      router.push("/(auth)/login");
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
      alert(err instanceof Error ? err.message : "Failed to react");
    }
  }

  function openTried() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    setTriedOpen(true);
  }

  async function handleSubmitTried() {
    setSubmittingTried(true);
    try {
      await api.tryRecipe(id, {
        comment: triedComment.trim() || undefined,
        rating: triedRating || undefined,
        imageUrl: triedImageUrl ?? undefined,
      });
      setTriedOpen(false);
      setTriedComment("");
      setTriedRating(0);
      setTriedImageUrl(null);
      loadRecipe();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmittingTried(false);
    }
  }

  function openGrocery() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    setGroceryListName(`${recipe.title} groceries`);
    setGroceryOpen(true);
  }

  async function handleAddToGrocery() {
    setAddingToGrocery(true);
    try {
      const [list] = await api.createGroceryList([id], groceryListName.trim() || undefined);
      setGroceryOpen(false);
      if (list) router.push(`/grocery/${list.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create grocery list");
    } finally {
      setAddingToGrocery(false);
    }
  }

  async function handleTranslate(lang: string) {
    setTranslateOpen(false);
    setTranslating(true);
    try {
      const result = await api.translateRecipe(id, lang);
      setTranslation(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to translate recipe");
    } finally {
      setTranslating(false);
    }
  }

  if (loading || !recipe) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  return (
    <ScreenContainer>
      {recipe.imageUrl ? (
        <Image
          source={{ uri: recipe.imageUrl }}
          className="mb-4 h-48 w-full rounded-2xl"
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50">{displayTitle}</Text>
        <Button
          size="sm"
          fullWidth={false}
          variant="outline"
          onPress={() => (translation ? setTranslation(null) : setTranslateOpen(true))}
          loading={translating}
        >
          {translation ? "Show original" : "🌐 Translate"}
        </Button>
      </View>
      {displayDescription ? <Text className="mt-2 text-neutral-600 dark:text-neutral-400">{displayDescription}</Text> : null}
      <EmojiReactions
        reactions={descriptionReactions}
        onToggle={(emoji, reactedByViewer) =>
          handleReact("recipe_description", id, emoji, reactedByViewer)
        }
      />

      <Card className="mt-4 flex-row gap-4 bg-neutral-50 dark:bg-neutral-900">
        <StatBlock emoji="❤️" value={recipe.likesCount || 0} label="Likes" />
        <StatBlock emoji="⭐" value={recipe.averageRating?.toFixed(1) || "N/A"} label="Rating" />
        <StatBlock emoji="💬" value={recipe.commentsCount || 0} label="Comments" />
        <StatBlock emoji="✅" value={recipe.triedCount || 0} label="Tried" />
      </Card>

      <View className="mt-4 flex-row items-center gap-2">
        <Button className="flex-1" variant={liked ? "primary" : "outline"} size="sm" onPress={handleLike}>
          {liked ? "❤️ Liked" : "🤍 Like"}
        </Button>
        <Button className="flex-1" variant="outline" size="sm" onPress={openTried}>
          ✅ Tried
        </Button>
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2.5">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rate this recipe</Text>
        <StarRating value={myRating} onChange={handleRate} size={20} />
      </View>

      {!isOwner ? (
        <Button className="mt-3" variant="outline" onPress={openGrocery}>
          🛒 Add to grocery list
        </Button>
      ) : (
        <Button className="mt-3" variant="outline" onPress={() => router.push(`/recipes/${id}/edit`)}>
          Edit recipe
        </Button>
      )}

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Ingredients</Text>
      {(displayIngredients || []).map((ing: any, idx: number) => (
        <Text key={idx} className="mt-1 text-neutral-700 dark:text-neutral-300">
          • {ing.quantity} {ing.name}
        </Text>
      ))}

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Steps</Text>
      {(displaySteps || []).map((step: any, idx: number) => (
        <Card key={idx} className="mt-3 bg-neutral-50 dark:bg-neutral-900">
          <Text className="font-semibold text-neutral-900 dark:text-neutral-50">Step {step.stepNumber || idx + 1}</Text>
          <Text className="mt-1 text-neutral-700 dark:text-neutral-300">{step.instructionText}</Text>
        </Card>
      ))}

      <Text className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Comments</Text>
      {comments.filter((c) => !c.parentCommentId).length > 0 ? (
        comments
          .filter((c) => !c.parentCommentId)
          .map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment as CommentData}
              replies={comments.filter((c) => c.parentCommentId === comment.id) as CommentData[]}
              onLike={handleLikeComment}
              onReact={(commentId, emoji, reactedByViewer) =>
                handleReact("comment", commentId, emoji, reactedByViewer)
              }
              onSubmitReply={handleSubmitReply}
            />
          ))
      ) : (
        <Text className="mt-3 text-neutral-500 dark:text-neutral-400">No comments yet. Be the first!</Text>
      )}
      <View className="mt-4 flex-row items-start gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2">
        <TextInput
          placeholder="Add a comment..."
          placeholderTextColor="#9CA3AF"
          multiline
          value={commentText}
          onChangeText={setCommentText}
          className="min-h-24 flex-1 text-neutral-900 dark:text-neutral-100"
          style={{ textAlignVertical: "top" }}
        />
        <EmojiPickerButton onSelect={(emoji) => setCommentText((prev) => prev + emoji)} />
      </View>
      <Button className="mt-2" variant="outline" onPress={handleAddComment} loading={submittingComment}>
        Post comment
      </Button>

      <Button className="mt-6" onPress={() => router.push(`/recipes/${id}/cook`)}>
        Start cooking mode
      </Button>

      <Modal visible={triedOpen} onClose={() => setTriedOpen(false)} title="Mark as tried">
        <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">How did it turn out?</Text>
        <StarRating value={triedRating} onChange={setTriedRating} />
        <View className="mt-4">
          <Input placeholder="Notes (optional)" multiline value={triedComment} onChangeText={setTriedComment} />
        </View>
        <View className="mt-4">
          <ImagePickerField imageUrl={triedImageUrl} onChange={setTriedImageUrl} />
        </View>
        <Button className="mt-5" onPress={handleSubmitTried} loading={submittingTried}>
          Save
        </Button>
      </Modal>

      <Modal visible={groceryOpen} onClose={() => setGroceryOpen(false)} title="Add to grocery list">
        <Input label="List name" value={groceryListName} onChangeText={setGroceryListName} />
        <Button className="mt-4" onPress={handleAddToGrocery} loading={addingToGrocery}>
          Create list
        </Button>
      </Modal>

      <Modal visible={translateOpen} onClose={() => setTranslateOpen(false)} title="Translate recipe">
        <View className="flex-row flex-wrap gap-2">
          {Object.values(RECIPE_LANGUAGES).map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => handleTranslate(lang.code)}
            >
              {lang.nativeName}
            </Button>
          ))}
        </View>
      </Modal>
    </ScreenContainer>
  );
}
