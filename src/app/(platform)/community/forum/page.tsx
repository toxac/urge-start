
import { getForumPosts } from '@/actions/forum';
import ForumFeed from '@/components/community/ForumFeed';

export default async function ForumPage() {
  const initialData = await getForumPosts({
    stream: 'for-you',
    sort: 'latest',
    page: 1,
  });

  return <ForumFeed initialData={initialData} />;
}
