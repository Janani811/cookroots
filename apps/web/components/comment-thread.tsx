"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmojiReactions } from "@/components/emoji-reactions";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import type { ReactionSummary } from "@/lib/api";

export type CommentData = {
  id: string;
  parentCommentId?: string | null;
  text?: string;
  content?: string;
  createdAt: string;
  user?: { id?: string; name?: string; profileImage?: string | null };
  likesCount?: number;
  likedByViewer?: boolean;
  reactions?: ReactionSummary[];
};

function CommentRow({
  comment,
  isLoggedIn,
  onLike,
  onReact,
  onReplyClick,
  t,
}: {
  comment: CommentData;
  isLoggedIn: boolean;
  onLike: (commentId: string, liked: boolean) => void;
  onReact: (commentId: string, emoji: string, reactedByViewer: boolean) => void;
  onReplyClick?: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{comment.user?.name || t("recipeDetail.anonymous")}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm">{comment.text || comment.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onLike(comment.id, !!comment.likedByViewer)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <span className={comment.likedByViewer ? "text-destructive" : undefined}>❤️</span>
          {comment.likesCount ? <span>{comment.likesCount}</span> : null}
        </button>
        {onReplyClick && (
          <button
            type="button"
            disabled={!isLoggedIn}
            onClick={onReplyClick}
            className="text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("recipeDetail.reply")}
          </button>
        )}
        <EmojiReactions
          reactions={comment.reactions ?? []}
          onToggle={(emoji, reactedByViewer) => onReact(comment.id, emoji, reactedByViewer)}
        />
      </div>
    </div>
  );
}

export function CommentThread({
  comment,
  replies,
  isLoggedIn,
  onLike,
  onReact,
  onSubmitReply,
  t,
}: {
  comment: CommentData;
  replies: CommentData[];
  isLoggedIn: boolean;
  onLike: (commentId: string, liked: boolean) => void;
  onReact: (commentId: string, emoji: string, reactedByViewer: boolean) => void;
  onSubmitReply: (parentId: string, text: string) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="border-t pt-4">
      <CommentRow
        comment={comment}
        isLoggedIn={isLoggedIn}
        onLike={onLike}
        onReact={onReact}
        onReplyClick={() => setReplyOpen((v) => !v)}
        t={t}
      />

      {replyOpen && (
        <form onSubmit={handleSubmit} className="ml-6 mt-3 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("recipeDetail.replyPlaceholder")}
            className="flex-1 rounded-md border border-input px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <EmojiPickerButton onSelect={(emoji) => setReplyText((prev) => prev + emoji)} />
          <Button type="submit" size="sm" disabled={submitting || !replyText.trim()}>
            {t("recipeDetail.postReply")}
          </Button>
        </form>
      )}

      {replies.length > 0 && (
        <div className="ml-6 mt-4 space-y-4 border-l pl-4">
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isLoggedIn={isLoggedIn}
              onLike={onLike}
              onReact={onReact}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
