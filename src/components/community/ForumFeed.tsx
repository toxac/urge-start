
'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Search, SlidersHorizontal, Plus, X} from 'lucide-react';

import { getForumPosts } from '@/actions/forum';
import ForumPostCard from './ForumPostCard';
import ForumComposer from './ForumComposer';

import type { ForumPost, ForumStream, ForumSort,  } from '@/lib/types/forum';

const streams: { value: ForumStream; label: string }[] = [
  { value: 'for-you', label: 'For you' },
  { value: 'introductions', label: 'Introductions' },
  { value: 'insight', label: 'Insights' },
  { value: 'experiment', label: 'Experiments' },
  { value: 'question', label: 'Questions' },
  { value: 'reflection', label: 'Reflections' },
  { value: 'milestone', label: 'Milestones' },
];

type FeedResult = Awaited<ReturnType<typeof getForumPosts>>;

export default function ForumFeed({
  initialData,
}: {
  initialData: FeedResult;
}) {
  const [posts, setPosts] = useState<ForumPost[]>(
    initialData.posts as ForumPost[],
  );
  const [stream, setStream] = useState<ForumStream>('for-you');
  const [sort, setSort] = useState<ForumSort>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(initialData.page);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const loadPosts = useCallback(
    (options: {
      stream: ForumStream;
      sort: ForumSort;
      search: string;
      page: number;
      append?: boolean;
    }) => {
      startTransition(async () => {
        try {
          setError(null);

          const result = await getForumPosts({
            stream: options.stream,
            sort: options.sort,
            search: options.search || undefined,
            page: options.page,
          });

          setPosts((current) =>
            options.append ? [...current, ...(result.posts as ForumPost[])] : (result.posts as ForumPost[]),
          );
          setPage(result.page);
          setHasMore(result.hasMore);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load community posts.',
          );
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (
      stream === 'for-you' &&
      sort === 'latest' &&
      search === ''
    ) {
      return;
    }

    loadPosts({ stream, sort, search, page: 1 });
  }, [stream, sort, search, loadPosts]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function handleStreamChange(nextStream: ForumStream) {
    setStream(nextStream);
    setPage(1);
  }

  function handleSortChange(nextSort: ForumSort) {
    setSort(nextSort);
    setPage(1);
  }

  function loadMore() {
    if (isPending || !hasMore) return;

    loadPosts({
      stream,
      sort,
      search,
      page: page + 1,
      append: true,
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
  <div>
    <p className="text-sm font-medium text-[#FF502F]">
      Urge community
    </p>
    <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
      Learn by doing. Grow together.
    </h1>
    <p className="mt-2 text-gray-600">
      Share your experiments, ask questions, and learn from people building
      their own businesses.
    </p>
  </div>

  <button
    type="button"
    onClick={() => setIsComposerOpen((open) => !open)}
    aria-expanded={isComposerOpen}
    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#FF502F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e94729]"
  >
    {isComposerOpen ? <X size={18} /> : <Plus size={18} />}
    <span>{isComposerOpen ? 'Cancel' : 'Create post'}</span>
  </button>
</header>

{isComposerOpen && (
  <ForumComposer />
)}

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search community posts..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {streams.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => handleStreamChange(item.value)}
            aria-pressed={stream === item.value}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              stream === item.value
                ? 'bg-[#FF502F] text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {isPending ? 'Updating posts…' : `${posts.length} posts shown`}
        </p>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <SlidersHorizontal size={16} />
          <span className="sr-only">Sort posts</span>
          <select
            value={sort}
            onChange={(event) =>
              handleSortChange(event.target.value as ForumSort)
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#FF502F]"
          >
            <option value="latest">Most recent</option>
            <option value="discussed">Most discussed</option>
          </select>
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() =>
              loadPosts({ stream, sort, search, page: 1 })
            }
            className="ml-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) =>
          post.id ? <ForumPostCard key={post.id} post={post} /> : null,
        )}

        {!isPending && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <h2 className="font-semibold text-gray-900">Nothing here yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              Try another stream or search, or be the first to share something.
            </p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-6">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
