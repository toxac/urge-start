"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";

type PostIntent =
  | "insight"
  | "experiment"
  | "question"
  | "reflection"
  | "milestone";

type Stream = "for-you" | "introductions" | PostIntent;

type Post = {
  id: string;
  author: string;
  initials: string;
  role: string;
  time: string;
  title: string;
  body: string;
  contentType: string;
  intent?: PostIntent;
  mission?: string;
  comments: number;
  reactions: number;
  reacted?: boolean;
  saved?: boolean;
  accent?: string;
  prompt?: string;
};

const initialPosts: Post[] = [
  {
    id: "intro-01",
    author: "Nisha Kapoor",
    initials: "NK",
    role: "Exploring a food business",
    time: "12 min ago",
    title: "Hello from Bengaluru 👋",
    body: "I’ve spent the last eight years working in food and hospitality. I keep coming back to one question: why is it still so hard for small food businesses to find reliable, affordable support? I’m here to explore whether I can do something about it.",
    contentType: "introduction",
    mission: "Mission 1 · Move Before Ready · Quest 3",
    comments: 4,
    reactions: 12,
    accent: "bg-orange-100 text-orange-800",
  },
  {
    id: "post-02",
    author: "Rahul Menon",
    initials: "RM",
    role: "Building a service business",
    time: "38 min ago",
    title: "A small pattern I noticed while talking to shop owners",
    body: "Three shop owners told me they don’t need another marketing tool. They need someone to help them decide what to do every week. I went in expecting a software problem and came out wondering if it’s actually a confidence and prioritisation problem.",
    contentType: "opportunity",
    intent: "insight",
    mission: "Mission 2 · See What Others Miss",
    comments: 7,
    reactions: 18,
    accent: "bg-amber-100 text-amber-800",
  },
  {
    id: "post-03",
    author: "Farah Ali",
    initials: "FA",
    role: "Testing a neighbourhood idea",
    time: "1 hr ago",
    title: "I asked five parents what they do after school",
    body: "I’m exploring a local after-school activity club. Instead of pitching the idea, I asked parents to walk me through a normal weekday. Four of the five mentioned the same stressful hour. I’m going to learn more before I decide what to offer.",
    contentType: "test",
    intent: "experiment",
    mission: "Mission 3 · Put It to the Test",
    comments: 3,
    reactions: 9,
    accent: "bg-sky-100 text-sky-800",
    prompt: "What would you want to understand next?",
  },
  {
    id: "post-04",
    author: "Dev Shah",
    initials: "DS",
    role: "First-time founder",
    time: "2 hrs ago",
    title: "Can I test this without building anything first?",
    body: "I have an idea for a simple tool for independent consultants, but I’m not sure how to test demand without making a prototype. What have you tried that helped you learn whether someone would actually pay?",
    contentType: "opportunity",
    intent: "question",
    mission: "Mission 3 · Put It to the Test",
    comments: 6,
    reactions: 5,
    accent: "bg-violet-100 text-violet-800",
    prompt: "Share an example or a small test they could try",
  },
  {
    id: "post-05",
    author: "Meera Thomas",
    initials: "MT",
    role: "Turning an idea into action",
    time: "Yesterday",
    title: "I thought I needed confidence. I needed a smaller next step.",
    body: "I kept waiting to feel ready to contact potential customers. Today I sent one message with one question. It took less than two minutes. I’m still nervous, but now I have something real to learn from.",
    contentType: "reflection",
    intent: "reflection",
    mission: "Mission 1 · Move Before Ready",
    comments: 8,
    reactions: 21,
    accent: "bg-rose-100 text-rose-800",
  },
  {
    id: "post-06",
    author: "Arjun Rao",
    initials: "AR",
    role: "Starting a design studio",
    time: "Yesterday",
    title: "First paid pilot confirmed",
    body: "A small milestone, but a meaningful one: someone agreed to pay for a pilot. It’s not proof that the whole business will work. It is proof that I can ask, listen, and make a next move.",
    contentType: "build",
    intent: "milestone",
    mission: "Mission 5 · Build the Machine",
    comments: 5,
    reactions: 16,
    accent: "bg-emerald-100 text-emerald-800",
  },
];

const streamItems: {
  id: Stream;
  label: string;
  description: string;
}[] = [
  {
    id: "for-you",
    label: "For you",
    description: "A mix of conversations from across the community",
  },
  {
    id: "introductions",
    label: "Introductions",
    description: "Meet people taking their first steps",
  },
  {
    id: "insight",
    label: "Insights",
    description: "Patterns, observations and things you’ve noticed",
  },
  {
    id: "experiment",
    label: "Experiments",
    description: "What people are trying in the real world",
  },
  {
    id: "question",
    label: "Questions",
    description: "Ask for help, perspective or a second opinion",
  },
  {
    id: "reflection",
    label: "Reflections",
    description: "What you’re learning along the way",
  },
  {
    id: "milestone",
    label: "Milestones",
    description: "Small wins and meaningful progress",
  },
];

const intentLabels: Record<PostIntent, string> = {
  insight: "Insight",
  experiment: "Experiment",
  question: "Question",
  reflection: "Reflection",
  milestone: "Milestone",
};

const intentStyles: Record<PostIntent, string> = {
  insight: "bg-amber-50 text-amber-800",
  experiment: "bg-sky-50 text-sky-800",
  question: "bg-violet-50 text-violet-800",
  reflection: "bg-rose-50 text-rose-800",
  milestone: "bg-emerald-50 text-emerald-800",
};

function formatCount(value: number) {
  return value > 99 ? "99+" : String(value);
}

export default function CommunityForumPage() {
  const [activeStream, setActiveStream] =
    useState<Stream>("for-you");

  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<"latest" | "discussed">("latest");

  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerIntent, setComposerIntent] =
    useState<PostIntent>("insight");

  const [composerTitle, setComposerTitle] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerContext, setComposerContext] = useState("");

  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [replyDrafts, setReplyDrafts] =
    useState<Record<string, string>>({});

  const [replies, setReplies] =
    useState<Record<string, string[]>>({});

  const [notice, setNotice] = useState("");

  const selectedStream = streamItems.find(
    (item) => item.id === activeStream,
  )!;

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = posts.filter((post) => {
      const matchesStream =
        activeStream === "for-you" ||
        (activeStream === "introductions"
          ? post.contentType === "introduction"
          : post.intent === activeStream);

      const matchesSearch =
        !query ||
        [
          post.title,
          post.body,
          post.author,
          post.role,
          post.mission ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStream && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "discussed") {
        return (
          b.comments +
          (replies[b.id]?.length ?? 0) -
          (a.comments + (replies[a.id]?.length ?? 0))
        );
      }

      return posts.indexOf(a) - posts.indexOf(b);
    });
  }, [activeStream, posts, search, sort, replies]);

  function toggleReaction(postId: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              reacted: !post.reacted,
              reactions: Math.max(
                0,
                post.reactions + (post.reacted ? -1 : 1),
              ),
            }
          : post,
      ),
    );
  }

  function toggleSave(postId: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, saved: !post.saved }
          : post,
      ),
    );

    setNotice("Your saved posts are a mock interaction for now.");
    window.setTimeout(() => setNotice(""), 2600);
  }

  function toggleReplies(postId: string) {
    setExpandedReplies((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  function submitReply(postId: string) {
    const body = (replyDrafts[postId] ?? "").trim();

    if (!body) return;

    setReplies((current) => ({
      ...current,
      [postId]: [...(current[postId] ?? []), body],
    }));

    setReplyDrafts((current) => ({
      ...current,
      [postId]: "",
    }));

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post,
      ),
    );

    setExpandedReplies((current) =>
      current.includes(postId)
        ? current
        : [...current, postId],
    );
  }

  function publishPost() {
    const body = composerBody.trim();

    if (!body) return;

    const isIntroduction = composerContext === "introduction";

    const newPost: Post = {
      id: `local-${Date.now()}`,
      author: "You",
      initials: "YO",
      role: "Urge community member",
      time: "Just now",
      title:
        composerTitle.trim() ||
        body.split(/[.!?]/)[0].slice(0, 72) ||
        "A thought I wanted to share",
      body,
      contentType: isIntroduction
        ? "introduction"
        : composerContext || "opportunity",
      intent: isIntroduction ? undefined : composerIntent,
      mission: isIntroduction
        ? "Mission 1 · Move Before Ready · Quest 3"
        : undefined,
      comments: 0,
      reactions: 0,
      accent: "bg-orange-100 text-orange-800",
    };

    setPosts((current) => [newPost, ...current]);

    setActiveStream(
      isIntroduction ? "introductions" : composerIntent,
    );

    setComposerOpen(false);
    setComposerTitle("");
    setComposerBody("");
    setComposerContext("");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Community / Forum
            </p>

            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              A place to figure it out together.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Share what you’re noticing, what you’re trying, and what
              you’re learning as you build. Real progress starts with
              real conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Share something
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0">
            {/* Composer entry point */}
            <section className="mb-5 rounded-xl border border-border bg-card p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary/50 hover:bg-muted/30 sm:p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-800">
                  YO
                </span>

                <span className="min-w-0 flex-1 text-sm text-muted-foreground sm:text-base">
                  What have you noticed, tried, or learned recently?
                </span>

                <span className="hidden shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground sm:inline-flex">
                  Write a post
                </span>

                <Plus className="h-5 w-5 shrink-0 text-muted-foreground sm:hidden" />
              </button>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposerIntent("insight");
                    setComposerContext("");
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Share an insight
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComposerIntent("experiment");
                    setComposerContext("");
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Share an experiment
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComposerIntent("question");
                    setComposerContext("");
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                  Ask a question
                </button>
              </div>
            </section>

            {/* Streams */}
            <div className="mb-4 border-b border-border">
              <div
                className="-mb-px flex gap-1 overflow-x-auto pb-px"
                role="tablist"
                aria-label="Forum streams"
              >
                {streamItems.map((stream) => {
                  const active = activeStream === stream.id;

                  const count =
                    stream.id === "introductions"
                      ? posts.filter(
                          (post) =>
                            post.contentType === "introduction",
                        ).length
                      : stream.id === "for-you"
                        ? posts.length
                        : posts.filter(
                            (post) => post.intent === stream.id,
                          ).length;

                  return (
                    <button
                      key={stream.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveStream(stream.id)}
                      className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition ${
                        active
                          ? "border-primary font-semibold text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {stream.label}

                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stream heading, search and sorting */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectedStream.label}
                </h2>

                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                  {selectedStream.description}
                </p>
              </div>

              <div className="flex gap-2">
                <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search posts"
                    aria-label="Search posts"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="relative">
                  <span className="sr-only">Sort posts</span>

                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target.value as "latest" | "discussed",
                      )
                    }
                    className="h-10 appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="latest">Latest</option>
                    <option value="discussed">Most discussed</option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              </div>
            </div>

            {/* Post feed */}
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-border/80 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        post.accent ?? "bg-muted text-foreground"
                      }`}
                    >
                      {post.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold">
                          {post.author}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          · {post.time}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {post.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={`More options for ${post.title}`}
                      onClick={() => {
                        setNotice(
                          "Post options and reporting will be connected later.",
                        );
                        window.setTimeout(() => setNotice(""), 2600);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {post.contentType === "introduction" ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Introduction
                        </span>
                      ) : post.intent ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${intentStyles[post.intent]}`}
                        >
                          {intentLabels[post.intent]}
                        </span>
                      ) : null}

                      {post.mission && (
                        <span className="text-xs text-muted-foreground">
                          {post.mission}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/community/forum/${post.id}`}
                      className="group block"
                    >
                      <h3 className="text-lg font-semibold leading-7 tracking-tight group-hover:text-primary sm:text-xl">
                        {post.title}

                        <ArrowUpRight className="ml-1 inline h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                      </h3>
                    </Link>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/85 sm:text-base">
                      {post.body}
                    </p>
                  </div>

                  {/* Feedback actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={!!post.reacted}
                        onClick={() => toggleReaction(post.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition ${
                          post.reacted
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {post.reacted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}

                        Helpful

                        <span className="text-xs">
                          {formatCount(post.reactions)}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleReplies(post.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <MessageCircle className="h-4 w-4" />

                        Respond

                        <span className="text-xs">
                          {formatCount(
                            post.comments +
                              (replies[post.id]?.length ?? 0),
                          )}
                        </span>
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-pressed={!!post.saved}
                      onClick={() => toggleSave(post.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        post.saved
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          post.saved ? "fill-current" : ""
                        }`}
                      />

                      <span className="hidden sm:inline">
                        {post.saved ? "Saved" : "Save"}
                      </span>
                    </button>
                  </div>

                  {/* Inline replies */}
                  {expandedReplies.includes(post.id) && (
                    <div className="mt-3 border-t border-border pt-4">
                      {(replies[post.id] ?? []).map((reply, index) => (
                        <div
                          key={`${post.id}-reply-${index}`}
                          className="mb-3 flex gap-2.5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                            YO
                          </span>

                          <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-6">
                            {reply}
                          </p>
                        </div>
                      ))}

                      <div className="flex items-start gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-semibold text-orange-800">
                          YO
                        </span>

                        <div className="min-w-0 flex-1">
                          <textarea
                            value={replyDrafts[post.id] ?? ""}
                            onChange={(event) =>
                              setReplyDrafts((current) => ({
                                ...current,
                                [post.id]: event.target.value,
                              }))
                            }
                            rows={2}
                            placeholder={
                              post.prompt ?? "Share a thoughtful response…"
                            }
                            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />

                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => submitReply(post.id)}
                              disabled={
                                !(replyDrafts[post.id] ?? "").trim()
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))}

              {visiblePosts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold">
                    Nothing here just yet
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Try another search, or be the first to share something
                    in this stream.
                  </p>

                  <button
                    type="button"
                    onClick={() => setComposerOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Create a post
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Context rail */}
          <aside className="hidden space-y-4 xl:block">
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">
                  Community at a glance
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-2xl font-semibold tracking-tight">
                    {posts.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Conversations
                  </p>
                </div>

                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="text-2xl font-semibold tracking-tight">
                    {
                      posts.filter(
                        (post) => post.contentType === "introduction",
                      ).length
                    }
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Introductions
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                A useful community isn’t about having the best answer.
                It’s about helping each other see the next step more clearly.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">
                  Good things to share
                </h2>
              </div>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  An assumption you discovered was wrong.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  A small test you ran with a real person.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  A question you can’t answer alone.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  A step you took before you felt ready.
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Share your experience
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </section>

            <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                A reminder
              </p>

              <p className="mt-2 font-heading text-lg font-semibold leading-7 tracking-tight">
                You don’t have to figure it all out before you begin.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Share the work in progress. That’s where useful conversations begin.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Mock interaction notice */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg"
        >
          {notice}
        </div>
      )}

      {/* Composer modal */}
      {composerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setComposerOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Community / Forum
                </p>

                <h2
                  id="composer-title"
                  className="mt-2 font-heading text-2xl font-semibold tracking-tight"
                >
                  Share something real.
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A question, a small experiment, a useful insight — it
                  doesn’t have to be polished.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                aria-label="Close composer"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">
                What are you sharing?
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(
                  [
                    "insight",
                    "experiment",
                    "question",
                    "reflection",
                    "milestone",
                  ] as PostIntent[]
                ).map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    aria-pressed={composerIntent === intent}
                    onClick={() => {
                      setComposerIntent(intent);
                      setComposerContext("");
                    }}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      composerIntent === intent &&
                      composerContext !== "introduction"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="block font-semibold">
                      {intentLabels[intent]}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {intent === "insight" && "A pattern or observation"}
                      {intent === "experiment" && "Something you tried"}
                      {intent === "question" && "Help or perspective"}
                      {intent === "reflection" && "What you’re learning"}
                      {intent === "milestone" && "A step forward"}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  aria-pressed={composerContext === "introduction"}
                  onClick={() => setComposerContext("introduction")}
                  className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                    composerContext === "introduction"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="block font-semibold">
                    Introduction
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Introduce yourself to the community
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="post-title"
                  className="mb-2 block text-sm font-semibold"
                >
                  Title{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <input
                  id="post-title"
                  value={composerTitle}
                  onChange={(event) =>
                    setComposerTitle(event.target.value)
                  }
                  maxLength={120}
                  placeholder="Give your post a clear headline"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <label
                  htmlFor="post-body"
                  className="mb-2 block text-sm font-semibold"
                >
                  Your post
                </label>

                <textarea
                  id="post-body"
                  value={composerBody}
                  onChange={(event) =>
                    setComposerBody(event.target.value)
                  }
                  rows={6}
                  maxLength={5000}
                  placeholder={
                    composerContext === "introduction"
                      ? "Tell people a little about yourself, what brought you here, and what you’re exploring…"
                      : "What happened? What did you notice? What are you wondering about?"
                  }
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                />

                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {composerBody.length}/5000
                </p>
              </div>

              <div>
                <label
                  htmlFor="post-context"
                  className="mb-2 block text-sm font-semibold"
                >
                  Journey context{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <select
                  id="post-context"
                  value={composerContext}
                  onChange={(event) =>
                    setComposerContext(event.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="">No specific mission</option>
                  <option value="introduction">
                    Mission 1 · Quest 3 introduction
                  </option>
                  <option value="opportunity">
                    Opportunity discovery
                  </option>
                  <option value="test">
                    Testing an opportunity
                  </option>
                  <option value="planning">
                    Planning the business
                  </option>
                  <option value="build">
                    Building the solution
                  </option>
                  <option value="launch">Launching</option>
                  <option value="operate">
                    Operating the business
                  </option>
                </select>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Only the text you write here will be shared. Your
                  private mission answers and progress are not included.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                Mockup only — publishing stays in this page’s local state.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={publishPost}
                  disabled={!composerBody.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Publish post
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}