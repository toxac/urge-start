
'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type ForumReactionButtonProps = {
  postId: string;
  initialCount: number;
  initialReaction: string | null;
  onChanged?: (reaction: string | null, count: number) => void;
};

export default function ForumReactionButton({
  postId,
  initialCount,
  initialReaction,
  onChanged,
}: ForumReactionButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [reaction, setReaction] = useState(initialReaction);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReaction() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in to react to a post.');
      }

      const { data: existing, error: fetchError } = await supabase
        .from('content_reactions')
        .select('id, reaction_type')
        .eq('content_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let nextReaction: string | null;
      let nextCount = count;

      if (existing?.reaction_type === 'helpful') {
        const { error: deleteError } = await supabase
          .from('content_reactions')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        nextReaction = null;
        nextCount = Math.max(0, count - 1);
      } else if (existing) {
        const { error: updateError } = await supabase
          .from('content_reactions')
          .update({ reaction_type: 'helpful' })
          .eq('id', existing.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        nextReaction = 'helpful';
      } else {
        const { error: insertError } = await supabase
          .from('content_reactions')
          .insert({
            content_id: postId,
            user_id: user.id,
            reaction_type: 'helpful',
          });

        if (insertError) throw insertError;

        nextReaction = 'helpful';
        nextCount = count + 1;
      }

      setReaction(nextReaction);
      setCount(nextCount);
      onChanged?.(nextReaction, nextCount);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update your reaction. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  const hasReacted = reaction === 'helpful';

  return (
    <div>
      <button
        type="button"
        onClick={handleReaction}
        disabled={loading}
        aria-pressed={hasReacted}
        aria-label={hasReacted ? 'Remove helpful reaction' : 'Mark as helpful'}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          hasReacted
            ? 'bg-orange-50 text-[#FF502F]'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
      >
        <ThumbsUp size={16} />
        <span>{count}</span>
      </button>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
