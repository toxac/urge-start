
'use client';

import Link from 'next/link';
import { MessageCircle, ThumbsUp } from 'lucide-react';
import type { Tables } from '@/database.types';
import ForumReactionButton from './ForumReactionButton';
import type { ForumPost } from '@/lib/types/forum';
import {
  intentLabels,
  categoryLabels,
  intentStyles,
} from '@/lib/types/forum';

type ForumPostCardProps = {
  post: ForumPost;
  onReact?: (postId: string) => void;
  reacting?: boolean;
};


function getCategoryLabel(category: string | null): string | null {
  if (!category || !(category in categoryLabels)) return null;

  return categoryLabels[category as keyof typeof categoryLabels];
}

function getIntentLabel(intent: string | null): string | null {
  if (!intent || !(intent in intentLabels)) return null;

  return intentLabels[intent as keyof typeof intentLabels];
}

function getIntentStyle(intent: string | null): string {
  if (!intent || !(intent in intentStyles)) {
    return 'bg-gray-100 text-gray-700';
  }

  return intentStyles[intent as keyof typeof intentStyles];
}

function formatRelativeDate(date: string | null) {
    if (!date) return '';

    const timestamp = new Date(date).getTime();

    if (Number.isNaN(timestamp)) return '';

    const elapsed = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(elapsed / 60_000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year:
            new Date(date).getFullYear() !== new Date().getFullYear()
                ? 'numeric'
                : undefined,
    });
}

function getAuthorName(post: ForumPost) {
    return post.display_name?.trim() || post.username || 'Community member';
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
}

export default function ForumPostCard({
    post,
    onReact,
    reacting = false,
}: ForumPostCardProps) {
    const author = getAuthorName(post);
    const intent = post.post_intent;
    const category = post.category;
    const reactionCount = post.reaction_count ?? 0;
    const commentCount = post.comment_count ?? 0;
    const hasReacted = Boolean(post.my_reaction);

    const title =
        post.title?.trim() ||
        post.body?.trim().split(/[.!?]/)[0] ||
        'A thought from the community';

    const body = post.body?.trim() ?? '';
    if (!post.id) {
        return null;
    }

    return (
        <article className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 sm:p-6">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {post.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.avatar_url}
                            alt=""
                            className="size-full object-cover"
                        />
                    ) : (
                        getInitials(author)
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground">
                            {author}
                        </span>

                        {post.city && (
                            <span className="text-xs text-muted-foreground">
                                {post.city}
                                {post.country ? `, ${post.country}` : ''}
                            </span>
                        )}
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelativeDate(post.published_at ?? post.created_at)}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {category && (
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {getCategoryLabel(category) ?? category}
                    </span>
                )}

                {intent && (
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getIntentStyle(intent) ??
                            'bg-muted text-muted-foreground'
                            }`}
                    >
                        {getIntentLabel(intent) ?? intent}
                    </span>
                )}
            </div>

            <Link
                href={`/community/forum/${post.id}`}
                className="group mt-3 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Read post: ${title}`}
            >
                <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                    {title}
                </h2>

                {body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {body.length > 320
                            ? `${body.slice(0, 320).trimEnd()}…`
                            : body}
                    </p>
                )}
            </Link>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                <ForumReactionButton
                    postId={post.id}
                    initialCount={reactionCount}
                    initialReaction={post.my_reaction}
                    onChanged={() => onReact?.(post.id!)}
                />

                <Link
                    href={`/community/forum/${post.id}#comments`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`${commentCount} comments`}
                >
                    <MessageCircle className="size-4" />
                    <span>
                        {commentCount} {commentCount === 1 ? 'response' : 'responses'}
                    </span>
                </Link>
            </div>
        </article>
    );
}
