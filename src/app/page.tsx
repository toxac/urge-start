import Image from "next/image";


export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-6">
          <span className="font-heading text-xl font-bold tracking-tight">
            urge
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <a
            href="#"
            className="flex h-12 items-center rounded-lg bg-muted px-3 text-sm font-medium"
          >
            Home
          </a>

          <a
            href="#"
            className="flex h-12 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Program
          </a>

          <a
            href="#"
            className="flex h-12 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Community
          </a>

          <a
            href="#"
            className="flex h-12 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Network
          </a>

          <a
            href="#"
            className="flex h-12 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Events
          </a>
        </nav>

        <div className="border-t p-4">
          <a
            href="#"
            className="flex h-12 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Profile
          </a>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/95 px-6 backdrop-blur lg:hidden">
        <span className="font-heading text-xl font-bold tracking-tight">
          urge
        </span>
      </header>

      {/* Application area */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
            {/* Page / specimen header */}
            <header className="mb-12 max-w-4xl sm:mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Urge design specimen
              </p>

              <h1 className="mt-5 font-heading text-5xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                You don&apos;t need to be ready.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                This page is a test of the visual language we&apos;ll use
                throughout Urge. The interface should feel calm, spacious and
                human. It should help someone focus on what is in front of
                them without making everything feel like a dashboard.
              </p>
            </header>

            {/* Main experience + context rail */}
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-20">
              {/* Main content */}
              <section className="min-w-0 max-w-4xl">
                {/* Mission identity */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Mission 1
                  </p>

                  <h2 className="mt-5 font-heading text-4xl font-bold leading-[1] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                    Move Before Ready
                  </h2>

                  <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                    Before we talk about ideas, businesses or customers,
                    let&apos;s look at something simpler: your ability to move
                    when you don&apos;t have all the answers.
                  </p>
                </div>

                {/* Question */}
                <div className="mt-12 border-t border-border pt-10 sm:mt-16 sm:pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    The question
                  </p>

                  <blockquote className="mt-5 max-w-2xl font-heading text-xl italic leading-8 text-primary sm:text-2xl">
                    What are you waiting to feel ready for?
                  </blockquote>
                </div>

                {/* Prose example */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Long-form content
                  </p>

                  <article className="prose prose-neutral mt-6 max-w-2xl">
                    <h3>Let&apos;s look at what&apos;s actually going on.</h3>

                    <p>
                      Most of the time, the thing stopping us isn&apos;t a lack
                      of information. It&apos;s something underneath it. A
                      fear. A constraint. Something we don&apos;t want to get
                      wrong.
                    </p>

                    <p>
                      You don&apos;t need to fix that right now. You don&apos;t
                      need to convince yourself that everything will be fine.
                      For the moment, just notice what is actually happening.
                    </p>

                    <blockquote>
                      You can be uncertain and still take the next step.
                    </blockquote>

                    <h4>There may not be a clean answer yet.</h4>

                    <p>
                      That&apos;s okay. Urge isn&apos;t here to turn every
                      uncomfortable moment into a positive one. Sometimes the
                      useful thing is simply seeing something more clearly than
                      you did before.
                    </p>

                    <ul>
                      <li>Notice what is actually happening.</li>
                      <li>Write down what you know.</li>
                      <li>
                        Leave the things you don&apos;t know alone for now.
                      </li>
                    </ul>
                  </article>
                </div>

                {/* Observation */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    A separate object
                  </p>

                  <div className="mt-5 rounded-2xl border border-border p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Observation
                    </p>

                    <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight">
                      Something you noticed
                    </h3>

                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                      Cards are for things that are genuinely separate
                      objects: an observation, a resource, a project, progress
                      or a piece of context. Ordinary content doesn&apos;t need
                      a box around it.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                        Observation
                      </span>

                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary">
                        Useful later
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form controls */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Form controls
                  </p>

                  <div className="mt-6 max-w-xl space-y-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="observation"
                        className="text-sm font-medium"
                      >
                        What are you noticing?
                      </label>

                      <input
                        id="observation"
                        type="text"
                        placeholder="Write it in your own words..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />

                      <p className="text-sm text-muted-foreground">
                        There is no perfect answer here.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="reflection"
                        className="text-sm font-medium"
                      >
                        Tell us a little more
                      </label>

                      <textarea
                        id="reflection"
                        rows={5}
                        placeholder="Say what actually happened..."
                        className="flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Actions
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90">
                      Continue
                    </button>

                    <button className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-xs transition-colors hover:bg-muted">
                      Not yet
                    </button>

                    <button className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                      Go back
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Progress
                  </p>

                  <div className="mt-5 max-w-xl">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium">Mission progress</span>

                      <span className="shrink-0 text-muted-foreground">
                        4 of 7
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[57%] rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                {/* Semantic colours */}
                <div className="mt-14 sm:mt-16">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Context colours
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm font-medium">Neutral</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Most of the interface lives here.
                      </p>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-primary">
                        Brand / attention
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Used when something deserves attention.
                      </p>
                    </div>

                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-medium text-destructive">
                        Error
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Used only when something needs correction.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted p-4">
                      <p className="text-sm font-medium">Context</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Quiet information that supports the experience.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Context rail */}
              <aside className="self-start lg:sticky lg:top-8">
                <div className="rounded-2xl border border-border p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Context
                  </p>

                  <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                    Where you are
                  </h3>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-sm font-medium">Mission 1</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Move Before Ready
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Current</p>

                      <p className="mt-1 text-sm text-primary">
                        Looking at what&apos;s holding you back
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Progress</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        4 of 7 completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-muted p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Need help?
                  </p>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    You don&apos;t have to figure out what this means
                    immediately. Take your time. Come back when you&apos;re
                    ready.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-border p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Resource
                  </p>

                  <a
                    href="#"
                    className="mt-3 block text-sm font-medium underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                  >
                    Why starting before you&apos;re ready matters
                  </a>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    A short piece to read if you want some perspective.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


