import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmojiReactions } from "@/components/EmojiReactions";
import { EmojiPickerButton } from "@/components/EmojiPickerButton";
import type { ReactionSummary } from "@/lib/api";

export type CommentData = {
  id: string;
  parentCommentId?: string | null;
  text?: string;
  content?: string;
  createdAt: string;
  authorName?: string;
  user?: { id?: string; name?: string };
  likesCount?: number;
  likedByViewer?: boolean;
  reactions?: ReactionSummary[];
};

function CommentRow({
  comment,
  onLike,
  onReact,
  onReplyPress,
}: {
  comment: CommentData;
  onLike: (commentId: string, liked: boolean) => void;
  onReact: (commentId: string, emoji: string, reactedByViewer: boolean) => void;
  onReplyPress?: () => void;
}) {
  return (
    <View>
      <Text className="font-semibold text-neutral-900 dark:text-neutral-50">
        {comment.user?.name || comment.authorName || "Anonymous"}
      </Text>
      <Text className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{comment.content || comment.text}</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-4">
        <Pressable
          onPress={() => onLike(comment.id, !!comment.likedByViewer)}
          className="flex-row items-center gap-1"
        >
          <Text className="text-xs">{comment.likedByViewer ? "❤️" : "🤍"}</Text>
          {comment.likesCount ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{comment.likesCount}</Text>
          ) : null}
        </Pressable>
        {onReplyPress && (
          <Pressable onPress={onReplyPress}>
            <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Reply</Text>
          </Pressable>
        )}
      </View>
      <EmojiReactions
        reactions={comment.reactions ?? []}
        onToggle={(emoji, reactedByViewer) => onReact(comment.id, emoji, reactedByViewer)}
      />
    </View>
  );
}

export function CommentThread({
  comment,
  replies,
  onLike,
  onReact,
  onSubmitReply,
}: {
  comment: CommentData;
  replies: CommentData[];
  onLike: (commentId: string, liked: boolean) => void;
  onReact: (commentId: string, emoji: string, reactedByViewer: boolean) => void;
  onSubmitReply: (parentId: string, text: string) => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitReply(comment.id, replyText.trim());
      setReplyText("");
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <CommentRow
        comment={comment}
        onLike={onLike}
        onReact={onReact}
        onReplyPress={() => setReplyOpen((v) => !v)}
      />

      {replyOpen && (
        <View className="ml-4 mt-3">
          <View>
            <Input
              placeholder="Write a reply..."
              value={replyText}
              onChangeText={setReplyText}
              className="pr-12"
            />
            <View className="absolute bottom-2 right-2">
              <EmojiPickerButton onSelect={(emoji) => setReplyText((prev) => prev + emoji)} />
            </View>
          </View>
          <Button
            className="mt-2"
            size="sm"
            fullWidth={false}
            onPress={handleSubmit}
            loading={submitting}
          >
            Post Reply
          </Button>
        </View>
      )}

      {replies.length > 0 && (
        <View className="ml-4 mt-3 gap-3 border-l border-neutral-200 dark:border-neutral-800 pl-3">
          {replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} onLike={onLike} onReact={onReact} />
          ))}
        </View>
      )}
    </View>
  );
}
