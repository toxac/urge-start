Reference on Styles and Design

# 1. Font families

| Usage                    | Font  | Purpose                                    |
| ------------------------ | ----- | ------------------------------------------ |
| Headings                 | Inter | Clear, structured hierarchy                |
| Body and reading content | Geist | Comfortable, readable content              |
| Supporting text          | Geist | Instructions, descriptions and helper text |

# 2. Text hierarchy

These were the sizes and styles we discussed. The hierarchy below consolidates the earlier proposals and subsequent preferences.

Display / Hero

5xl–7xl

# Start before you're ready.

For major landing-page statements and prominent moments, not ordinary screens.

Page heading

3xl–4xl

# Move Before Ready

Mission titles and primary page headings.

Section heading

xl–2xl

## What brought you here?

Sections, questions and major content groupings.

Body / reading

text-lg

You don't need to have everything figured out. Start with what you know, what you have, and what you can do next.

Our explicit readability preference was `text-lg leading-8` for default reading content.

Lead text

text-xl

A little more context to introduce a page or an important activity.

Use `leading-8`.

Supporting text

text-sm

Instructions, explanations, hints and descriptions. We discussed `leading-6`.

Eyebrow / metadata

text-xs

MISSION 1 · MOVE BEFORE READY

Small labels, status information and contextual metadata.

The exact class examples from our earlier discussions were:

| Element                 | Tailwind classes                                                |
| ----------------------- | --------------------------------------------------------------- |
| Eyebrow                 | `text-xs font-medium uppercase tracking-[0.2em]`                |
| Hero                    | `text-5xl sm:text-6xl lg:text-7xl`                              |
| Page title              | `text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight` |
| Section heading         | `text-2xl sm:text-3xl`                                          |
| Lead                    | `text-xl leading-8`                                             |
| Default reading content | `text-lg leading-8`                                             |
| Supporting text         | `text-sm leading-6`                                             |
| Metadata                | `text-xs`                                                       |

These are reference classes from our discussions, not a claim that every class has already been implemented globally.

## 3. Rules we wanted to preserve

- Readability over density. Main reading content should be larger and easy to read.
- Use `text-lg leading-8` as the default for substantial reading content. We explicitly moved away from making `text-base` the default everywhere.
- Use hierarchy to communicate importance. Display text is for major moments; section headings and body text should remain distinguishable without making every heading oversized.
- Keep Tailwind's standard scale and breakpoints. Avoid custom size tokens and bespoke responsive breakpoints unless genuinely necessary.
- Use the typography plugin. We discussed Tailwind Typography's `prose prose-xl max-w-3xl` for mission and long-form content, while retaining explicit styles for page titles.
- Keep reading width comfortable. Long-form content should not stretch across the entire desktop viewport.

## 4. How this applies to Urge's mission experience

apply the hierarchy consistently across the program:

- Mission title: page-heading level.
- Quest title: section-heading level.
- Node title or primary question: section-heading level, adjusted to the screen's importance.
- Explanatory paragraphs: `text-lg leading-8`.
- Form labels: clear and prominent, usually `text-base` or `text-lg` depending on importance.
- Field instructions and helper text: `text-sm leading-6`.
- Mission number, status and progress metadata: `text-xs`.


