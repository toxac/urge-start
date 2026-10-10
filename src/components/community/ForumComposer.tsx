
'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserContent } from '@/actions/user-content';
import {
  categoryLabels,
  intentLabels,
  type ForumCategory,
  type ForumIntent,
} from '@/lib/types/forum';

type ComposerCategory = Exclude<ForumCategory, 'introduction'>;

const categories: ComposerCategory[] = [
  'opportunity',
  'test',
  'planning',
  'build',
  'launch',
  'operate',
];

const intents: ForumIntent[] = [
  'insight',
  'experiment',
  'question',
  'reflection',
  'milestone',
];

type ComposerStatus = 'draft' | 'published';

export default function ForumComposer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] =
    useState<ComposerCategory>('opportunity');
  const [intent, setIntent] = useState<ForumIntent>('question');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    status: ComposerStatus,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setError('Write something before saving or publishing.');
      return;
    }

    if (trimmedTitle.length > 200) {
      setError('The title must be 200 characters or fewer.');
      return;
    }

    if (trimmedBody.length > 20000) {
      setError('The post must be 20,000 characters or fewer.');
      return;
    }

    startTransition(async () => {
      try {
        await createUserContent({
          title: trimmedTitle || null,
          body: trimmedBody,
          category,
          post_intent: intent,
          status,
        });

        setTitle('');
        setBody('');
        setCategory('opportunity');
        setIntent('question');

        if (status === 'published') {
          setSuccess('Your post has been published.');
          router.push('/community/forum');
          router.refresh();
        } else {
          setSuccess('Your draft has been saved.');
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
        );
      }
    });
  }

  return (
    <form
      onSubmit={(event) => handleSubmit(event, 'published')}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Share with the community
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Share what you’re learning, testing, questioning, or building.
        </p>
      </div>

      <div>
        <label
          htmlFor="forum-title"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Title <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="forum-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Give your post a clear headline"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
        />
      </div>

      <div>
        <label
          htmlFor="forum-body"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          What would you like to share?
        </label>
        <textarea
          id="forum-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={20000}
          rows={6}
          required
          placeholder="Tell us what happened, what you learned, or where you're stuck..."
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {body.length.toLocaleString()} / 20,000
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="forum-category"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Topic
          </label>
          <select
            id="forum-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ComposerCategory)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="forum-intent"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            What kind of post is this?
          </label>
          <select
            id="forum-intent"
            value={intent}
            onChange={(event) =>
              setIntent(event.target.value as ForumIntent)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#FF502F] focus:ring-2 focus:ring-[#FF502F]/15"
          >
            {intents.map((item) => (
              <option key={item} value={item}>
                {intentLabels[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {success}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          disabled={isPending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              handleSubmit(
                {
                  preventDefault: () => {},
                } as FormEvent<HTMLFormElement>,
                'draft',
              );
            }
          }}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Save draft
        </button>

        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-xl bg-[#FF502F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e94729] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Publish post'}
        </button>
      </div>
    </form>
  );
}
