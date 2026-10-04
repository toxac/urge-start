"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

const assumptions = [
  "You need money.",
  "You need connections.",
  "You need a great idea.",
  "You need experience.",
  "You need to know what you're doing.",
];

const waysToBuild = [
  {
    number: "01",
    title: "A shop.",
    description: "Something people can walk into.",
  },
  {
    number: "02",
    title: "A trade.",
    description: "Something you know how to do well.",
  },
  {
    number: "03",
    title: "A service.",
    description: "Something that makes someone's life easier.",
  },
  {
    number: "04",
    title: "A craft.",
    description: "Something made with care and skill.",
  },
  {
    number: "05",
    title: "An idea.",
    description: "Something that should exist.",
  },
];

const startingAssets = [
  "The industry you've spent years inside.",
  "The problems you've learned to work around.",
  "The things people keep asking you for.",
  "The things you notice that others don't.",
  "The things you keep thinking could be done better.",
  "The ideas you've dismissed because they didn't look big enough.",
];

const support = [
  {
    number: "01",
    title: "A path",
    description:
      "A structured program that turns uncertainty into the next useful action.",
  },
  {
    number: "02",
    title: "People",
    description:
      "A community of people building alongside you — not watching from the sidelines.",
  },
  {
    number: "03",
    title: "Experts",
    description:
      "Practical help when you reach something you don't know how to solve alone.",
  },
  {
    number: "04",
    title: "Momentum",
    description:
      "Standups, events and accountability that keep an intention from becoming another unfinished idea.",
  },
];

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`urge-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Home() {
  const [assumptionIndex, setAssumptionIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAssumptionIndex((current) => (current + 1) % assumptions.length);
    }, 2600);

    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="overflow-x-hidden bg-white text-zinc-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-[-0.03em]"
            aria-label="Urge home"
          >
            urge
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/signup?intent=try"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              Try for free
            </Link>
            <Link
              href="/signup?intent=join"
              className="group flex items-center gap-2 text-sm font-medium tracking-[-0.01em]"
            >
              <span className="border-b border-black/25 pb-0.5 transition-colors group-hover:border-black">
                Join the program
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-white px-6 pb-16 pt-32 md:px-10 md:pb-20">
        <div className="urge-hero-grid pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative mx-auto w-full max-w-[1320px]">
          <div className="max-w-[1000px]">
            <p className="urge-eyebrow mb-7">A different way to think about starting</p>

            <h1 className="urge-display max-w-[1000px]">
              You already have
              <br />
              what it takes
              <br />
              to start.
            </h1>

            <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <p className="max-w-[650px] text-lg leading-8 text-zinc-500 md:text-xl">
                You don't need a perfect idea. You don't need a business
                degree. And you certainly don't need to look like the kind of
                founder the internet keeps showing you.
              </p>

              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href="/signup?intent=try"
                  className="group inline-flex w-fit items-center gap-3 rounded-full bg-zinc-100 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-zinc-200"
                >
                  Try for free
                </Link>
                <Link
                  href="/signup?intent=join"
                  className="group inline-flex w-fit items-center gap-3 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Join the program
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          <a
            href="#story"
            className="mt-16 flex w-fit items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-400 transition-colors hover:text-zinc-950"
          >
            <span className="h-px w-10 bg-zinc-300" />
            Keep going
            <ArrowDown className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="bg-white px-6 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <p className="urge-eyebrow">The story we've been told</p>

            <div>
              <Reveal>
                <h2 className="urge-section-title max-w-[760px]">
                  Starting a business has been made to look harder than it is.
                </h2>
              </Reveal>

              <div className="mt-20 max-w-[780px]">
                <div className="urge-assumption-window">
                  {assumptions.map((assumption, index) => (
                    <div
                      key={assumption}
                      className={`urge-assumption ${
                        index === assumptionIndex ? "is-active" : ""
                      }`}
                      aria-hidden={index !== assumptionIndex}
                    >
                      {assumption}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex min-h-7 items-center gap-3">
                  <span className="h-px w-12 bg-primary" />
                  <span className="text-sm font-medium text-zinc-500">Maybe.</span>
                </div>

                <p className="mt-14 max-w-[620px] text-lg leading-8 text-zinc-500">
                  The truth is less glamorous and much more useful: people have
                  been building useful businesses with ordinary resources for
                  a very long time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOOK CLOSER */}
      <section className="bg-zinc-950 px-6 py-28 text-white md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <p className="urge-eyebrow text-primary">Look closer</p>

          <Reveal className="mt-8">
            <h2 className="urge-section-title max-w-[900px]">
              There has never been just one way to build.
            </h2>
          </Reveal>

          <div className="mt-20 border-t border-white/15">
            {waysToBuild.map((item) => (
              <div
                key={item.number}
                className="group grid gap-5 border-b border-white/15 py-7 transition-colors duration-300 hover:bg-white/[0.025] md:grid-cols-[72px_1fr_1fr] md:items-center md:py-8"
              >
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/35">
                  {item.number}
                </span>
                <h3 className="text-2xl font-medium tracking-[-0.035em] md:text-3xl">
                  {item.title}
                </h3>
                <p className="max-w-[380px] text-sm leading-6 text-white/45 md:justify-self-end">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCALE */}
      <section className="bg-white px-6 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <p className="urge-eyebrow">Scale is not the point</p>

          <Reveal className="mt-8">
            <h2 className="urge-section-title max-w-[950px]">
              A business doesn't have to become enormous to become meaningful.
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-8 md:grid-cols-2 md:gap-16">
            <p className="max-w-[520px] text-lg leading-8 text-zinc-500">
              Somewhere along the way, building a business became synonymous
              with raising money, hiring fast and chasing a very particular
              definition of success.
            </p>
            <p className="max-w-[520px] text-lg leading-8 text-zinc-500">
              Urge starts somewhere simpler: solve something that matters to
              someone, make it useful, and build it at a scale that makes sense
              for your life.
            </p>
          </div>
        </div>
      </section>

      {/* START WITH WHAT YOU HAVE */}
      <section className="bg-zinc-100 px-6 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <p className="urge-eyebrow">Start with what you already have</p>

            <div>
              <Reveal>
                <h2 className="urge-section-title max-w-[820px]">
                  You might have more to work with than you think.
                </h2>
              </Reveal>

              <div className="mt-16 border-t border-zinc-950/10">
                {startingAssets.map((item, index) => (
                  <div
                    key={item}
                    className="grid gap-4 border-b border-zinc-950/10 py-6 md:grid-cols-[56px_1fr] md:py-7"
                  >
                    <span className="pt-1 text-[10px] font-medium tracking-[0.2em] text-zinc-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="max-w-[760px] text-base font-medium leading-7 tracking-[-0.015em] text-zinc-800 md:text-lg">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-12 text-xl font-medium tracking-[-0.025em] md:text-2xl">
                What if that's enough to start?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PART WE DON'T TALK ABOUT */}
      <section className="bg-white px-6 py-28 md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <p className="urge-eyebrow">The part we don't talk about</p>

          <div className="mt-12 grid overflow-hidden rounded-[2px] border border-zinc-950/10 md:grid-cols-2">
            <Reveal className="h-full">
              <div className="flex h-full min-h-[360px] flex-col justify-between bg-white p-8 md:min-h-[440px] md:p-12">
                <span className="text-[10px] font-medium tracking-[0.2em] text-zinc-400">
                  01
                </span>
                <h2 className="max-w-[520px] text-4xl font-medium leading-[1.02] tracking-[-0.055em] md:text-5xl lg:text-6xl">
                  Maybe the hardest part isn't building a business.
                </h2>
              </div>
            </Reveal>

            <Reveal className="h-full">
              <div className="flex h-full min-h-[360px] flex-col justify-between bg-zinc-950 p-8 text-white md:min-h-[440px] md:p-12">
                <span className="text-[10px] font-medium tracking-[0.2em] text-primary">
                  02
                </span>
                <h2 className="max-w-[520px] text-4xl font-medium leading-[1.02] tracking-[-0.055em] md:text-5xl lg:text-6xl">
                  Maybe it's{" "}
                  <span className="text-primary">believing</span> you could
                  build one.
                </h2>
              </div>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <p className="text-lg leading-8 text-zinc-500">
              Once you start moving, you can learn. You can test. You can
              adapt.
            </p>
            <p className="text-lg leading-8 text-zinc-500">
              You can ask for help. You can find people. You can figure things
              out.
            </p>
          </div>
        </div>
      </section>

      {/* YOU DON'T HAVE TO DO IT ALONE */}
      <section className="bg-zinc-950 px-6 py-28 text-white md:px-10 md:py-40">
        <div className="mx-auto max-w-[1320px]">
          <p className="urge-eyebrow text-primary">You don't have to do it alone</p>

          <Reveal className="mt-8">
            <div className="max-w-[900px]">
              <h2 className="text-4xl font-medium leading-[1.04] tracking-[-0.055em] md:text-6xl lg:text-7xl">
                You start with what you have.
              </h2>
              <h2 className="mt-2 text-4xl font-medium leading-[1.04] tracking-[-0.055em] text-white/45 md:text-6xl lg:text-7xl">
                We help you figure out what to do with it.
              </h2>
            </div>
          </Reveal>

          <div className="mt-20 grid border-y border-white/15 md:grid-cols-2">
            {support.map((item, index) => (
              <div
                key={item.number}
                className={`p-8 md:p-10 ${
                  index % 2 === 0 ? "md:border-r md:border-white/15" : ""
                } ${index < 2 ? "border-b border-white/15" : ""}`}
              >
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/30">
                  {item.number}
                </span>
                <h3 className="mt-16 text-2xl font-medium tracking-[-0.035em]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-[460px] text-sm leading-6 text-white/45">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary px-6 py-32 md:px-10 md:py-48">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-[1320px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/55">
            Your starting point
          </p>

          <h2 className="mt-8 max-w-[1000px] text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-zinc-950 md:text-7xl lg:text-8xl">
            So, what could you build?
          </h2>

          <p className="mt-10 max-w-[600px] text-lg leading-8 text-black/65">
            Tell us a little about where you are. We'll help you see what
            might be worth building from here.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/signup?intent=join"
              className="group inline-flex items-center gap-3 rounded-full bg-zinc-950 px-7 py-4 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Join the program
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup?intent=try"
              className="group inline-flex items-center gap-3 rounded-full bg-white/50 px-7 py-4 text-sm font-semibold text-zinc-950 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Try for free
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 px-6 py-8 text-white/35 md:px-10">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between text-xs">
          <span className="font-medium text-white">urge</span>
          <span>Build something useful.</span>
        </div>
      </footer>
    </main>
  );
}