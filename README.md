I'll write `mission2.ts` from your working doc and both feedback rounds, using the same node shape as missions 1 and 3-6.

I've written `mission2.ts` with all 25 nodes, from mission setup through the mission action. I haven't compiled it, and it won't type-check until the `types.ts` change below is made. It uses the node keys from your working doc, and your decisions are built in: the existing idea goes through the same pipeline, per-investigation observations for Q2 and per-question for Q3, and `isStrict` enforcement.

## Changes needed outside this file

**1. `types.ts`: add pacing to `ProgramNode`**

```ts
pacing?: { delay_days: number; isStrict?: boolean };
```

`isStrict: true` blocks until the delay has passed. If the flag is absent, the app only suggests the days. I used `pacing` at the top level, which means `program_nodes` needs a column for it, or the seeder must copy it into `metadata`. Which do you want?

**2. Schema**
- **`opportunity_status`** needs `parked`. The enum currently has `added`, `shortlisted` and `testing`, and Q2 and Q3 park opportunities.
- **`OBSERVATION_FOCUS_OPTIONS`** needs these new keys:
  - `research`: `feasibility_self`, `feasibility_research`, `feasibility_smallest`, `viability_payer`, `viability_market`, `viability_synthesis`
  - `competition`: `viability_competition`
  - `conversation`: `customer_interview`
- **`conversation`** is already in `OBSERVATION_TYPES`, so I kept it for interviews.

**3. A sequencing bug in your doc.** Q4 Action says it hands off to `m3-setup`, but the mission reveal and mission action come after it. I made Q4 Action only create the project and move on to `m2-reveal`. `m2-action` does the handoff. I also added `m2-action` as the first dependency of Mission 3, so in `mission3.ts` the setup should become `dependencies: ['m2-action']` instead of `['m2-reveal']`.

## Things I'd flag in Mission 2
- **Mission setup sits before Q1.** The existing idea is written as an observation (`metadata.is_existing_idea = true`), as an opportunity, and as a link between them. After that it goes through qualification like everything else.
- **Q4 Action is the only strict gate.** Q1 observe and the Q2 and Q3 desk-work nodes only suggest days, so they don't block anyone. The strict 2-day wait stays only where you want the reflection pause.
- **Q2 Action and Q3 Action both park opportunities.** Un-parking should be an explicit action available from the parked view, not part of the normal flow.
- **Q3 funnel risk.** An already-weak opportunity can reach interviews with thin evidence. That fits your "reveal it, don't block it" principle, but the Q3 reveal should make the gaps loud.

## Thoughts on Mission 3

M2 now ends with a project that carries a lot of evidence, while M3 setup only talks about "the opportunity, strongest evidence, people and unresolved questions." I'd tighten these points:

1. **Avoid repeating M2 in M3 Q1.** The M2 work overlaps with three M3 nodes:
   - `m3-q1-delivery` and `m3-q1-mvo` overlap with the smallest-deliverable brainstorm. They should start from that chosen version and the user's three sketches, not from a blank page.
   - `m3-q1-pricing` overlaps with the payer, spend and competitor-price research. It should open with those numbers and the interview answers about cost and current workarounds.
   - `m3-q1-outcome` can draw on the interview key quotes and the "what have you tried" answers.
2. **M3 setup should read the project.** It should show the competitors, the riskiest assumption, the kill conditions and the six-month test from the Q3 synthesis, plus the interview surprises. Those become what M3 tests, so setup can ask something like "which of these assumptions does this test put pressure on?"
3. **Q4 interviews give only a weak signal about intent.** M2 deliberately labels "would you pay?" as weak. M3 Q3 should state the contrast outright: the market test is about what people do, not what they say. The reveal in `m3-q3-reveal` already separates these, which is good.
4. **The asking experiments need a focus.** M3 Q3 will probably write `experiment` observations, but `OBSERVATION_FOCUS_OPTIONS.experiment` only has `asking`. You'll want something like `offer_test` or `market_response`, so the test can be queried apart from M1's practice asks.
5. **A failed M3 test needs a route back.** M2 keeps parked opportunities, so `m3-q3-action` can offer three paths: iterate the offer, return to a parked opportunity, or go back to Q1 observations. That also gives your "start over" idea in M2 Q4 a concrete home.
6. **Smaller points:**
   - `user_project_offers` already exists. Q1 and Q2 of M3 should write to it, and `selected_offer_id` makes Q3 clean.
   - Add a pacing delay to `m3-q3-capture`, because responses take days to arrive. `m3-q3-run` could carry the strict `isStrict` gate.

If you'd like, the next step is Pass 2 (the data shape for each M2 node) or a drafted revision of `mission3.ts` with the changes above. Which would you rather do first?