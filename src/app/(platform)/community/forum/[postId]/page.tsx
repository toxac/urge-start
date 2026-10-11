
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle, ThumbsUp } from 'lucide-react';

import { getForumPost } from '@/actions/forum';
import {
    categoryLabels,
    intentLabels,
    intentStyles,
} from '@/lib/types/forum';

function formatDate(date: string | null) {
    if (!date) return '';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return '';

    return new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(parsed);
}

function getAuthorName(post: NonNullable<Awaited<ReturnType<typeof getForumPost>>>) {
    return post.display_name?.trim() || post.username || 'Community member';
}

export default async function ForumPostDetailPage({
    params,
}: {
    params: Promise<{ postId: string }>;
}) {
    const { postId } = await params;

    // Reject malformed IDs before querying Supabase.
    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            postId,
        )
    ) {
        notFound();
    }

    let post;

    try {
        post = await getForumPost(postId);
    } catch {
        notFound();
    }

    if (!post?.id) {
        notFound();
    }

    const author = getAuthorName(post);
    const category = post.category;
    const intent = post.post_intent;

    const categoryLabel =
        category && category in categoryLabels
            ? categoryLabels[category as keyof typeof categoryLabels]
            : null;

    const intentLabel =
        intent && intent in intentLabels
            ? intentLabels[intent as keyof typeof intentLabels]
            : null;

    const intentStyle =
        intent && intent in intentStyles
            ? intentStyles[intent as keyof typeof intentStyles]
            : 'bg-gray-100 text-gray-700';

    const title =
        post.title?.trim() ||
        post.body?.trim().split(/[.!?]/)[0] ||
        'A thought from the community';

    return (
        <main className="mx-auto w-full max-w-3xl space-y-8">
            <Link
                href="/community/forum"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
                <ArrowLeft size={16} />
                Back to community
            </Link>

            <article className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="space-y-6 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                        {categoryLabel && (
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {categoryLabel}
                            </span>
                        )}

                        {intentLabel && (
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${intentStyle}`}
                            >
                                {intentLabel}
                            </span>
                        )}
                    </div>

                    <header className="space-y-4">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            {title}
                        </h1>

                        <div className="flex items-center gap-3">
                            {post.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={post.avatar_url}
                                    alt=""
                                    className="h-11 w-11 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {author
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()}
                                </div>
                            )}

                            <div className="min-w-0">
                                <p className="font-medium text-foreground">
                                    {author}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    {post.city && post.country
                                        ? `${post.city}, ${post.country}`
                                        : post.city || post.country || ''}
                                    {(post.city || post.country) && post.published_at
                                        ? ' · '
                                        : ''}
                                    {formatDate(post.published_at)}
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="whitespace-pre-wrap break-words text-base leading-8 text-foreground">
                        {post.body}
                    </div>

                    <div className="flex items-center gap-5 border-t border-border pt-5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                            <ThumbsUp size={17} />
                            {post.reaction_count ?? 0} reactions
                        </span>

                        <a
                            href="#comments"
                            className="inline-flex items-center gap-2 transition hover:text-foreground"
                        >
                            <MessageCircle size={17} />
                            {post.comment_count ?? 0} responses
                        </a>
                    </div>
                </div>
            </article>

            <section
                id="comments"
                className="rounded-2xl border border-dashed border-border p-6 sm:p-8"
            >
                <h2 className="text-xl font-semibold text-foreground">
                    Join the conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Responses and reactions will be available here as we add the
                    interaction components.
                </p>
            </section>
        </main>
    );
}
