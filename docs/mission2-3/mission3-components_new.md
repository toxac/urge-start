# Mission 3 component guide

Read `components-shared.md` first. M3 follows the same contract (props, pacing, upserts, `onComplete`) with the exceptions below.

## M3 differences from the shared guide

1. **AI appears at exactly two points**: `m3-q1-setup-test` (draft the five parts) and `m3-q3-read` (read the signals back). Everything else in M3 is deterministic or the user's own work. This includes reveals: they assemble stored data and make no AI call. Do not add DraftAndCorrect or AI helpers elsewhere in M3 (including `m3-q2-run`).
2. **Mirror, not oracle**: both AI moments **suggest**; the user's version wins. AI never decides whether the problem is real, never picks the test, never routes the user.
3. **Do not test a solution, a price or an offer.** No component in M3 asks for money, names a price, or presents a solution as something to buy.
4. Shared vocabulary rule applies: "observation", "opportunity", "project". Plus, in M3 UI use plain labels for the signal levels (see below).

## Vocabulary for M3

| Data / code | UI says |
|---|---|
| reach | "Did it land?" / "How many stopped" |
| action | "Did anyone do something?" |
| evidence | "What did they tell you?" |
| strong action | "Something that cost them" |
| weak action | "A small nod" |
| warm list | "People who raised their hand" (call it "warm list" only in settings or internal docs) |
| preset | a named way to test, with plain names; never "Wizard of Oz", "concierge", "MVP" |

---

## Data model

**Project** (`user_projects`) already exists from M2. M3 reads and extends `project.metadata`:

```
{
  approach { primary, secondary?, what_it_looks_like, why_this_way },   // from M2
  business_type: 'online' | 'offline' | 'hybrid',                        // set by m3-q1-access
  access_profile { ... },                                                // set by m3-q1-access
  active_test_id: uuid,                                                  // the test observation currently being run
  m3_result { route, state, strong_action_count, thin: boolean, at },    // set by m3-q3-action
  confirmed_problem { text, at },                                        // set by m3-action
  m4_focus: string                                                       // set by m3-action
}
```

**Test** = one `user_observations` row per pass:
`type 'experiment'`, `domain 'problem'`, `focus 'problem_test'`, `source_node_key`, `title` ("Test: {preset name}, pass {n}"), `content` (the framing text), link to project (`entity_type 'project'`, `relationship 'test'`).

```
metadata.kind = 'test'
metadata.test = {
  project_id, pass, previous_test_id?,
  preset_key | 'custom',
  design {
    who      { description, source: 'm2_conversation' | 'access' | 'other', contact_ids? },
    where    { channel, description },
    framing  { text, source_quote_ids: [] },
    action   { label, strength: 'strong' | 'weak', definition },
    reading  { reach, action, evidence },
    scope    { people, days }
  },
  status: 'designed' | 'committed' | 'running' | 'logged' | 'read',
  committed_at?, started_at?, ended_at?,
  reach { exposed?, stopped, unit, notes, entries: [{ at, exposed?, stopped }] },
  interpretation { ai_read_log_id?, section_feedback, noticed, user_read },
  state?, diagnosis?
}
```

**A person who acted** = one `user_observations` row (upsert on `(test_id, contact_id)` or `(test_id, handle)`):
`type 'experiment'`, `domain 'problem'`, `focus 'problem_test'`, `metadata.kind = 'response'`, `title` ("Priya: replied with an example"), `content` (what they said, in their words).

```
metadata.response = {
  test_id, contact_id?, handle?, channel,
  action_type, strength: 'strong' | 'weak',
  evidence { instance?, frequency?, cost?, workaround?, severity?, quote? },
  worst_case?: boolean,           // "who has it worst", set in m3-action
  on_warm_list: boolean
}
```

Links: `observation_links` to the project (`relationship 'test_response'`) and the contact.

**Warm list** = `user_contacts` rows with `'warm'` in `roles`: `name` (or handle), `contact_details` (email, handle, phone), `context { project_id, first_action, quote? }`, `metadata { warm_for_project_id, strength, source_test_id, added_at }`. Reuse an existing contact (for example a person from M2) by adding the role rather than creating a duplicate.

**Preset library** is code, not database: `src/program/testPresets.ts`.

```ts
type SolutionType = 'do_for_them' | 'tool' | 'connect' | 'teach';
type BusinessType = 'online' | 'offline' | 'hybrid';

type TestPreset = {
  key: string;
  name: string;                       // plain language
  solution_types: SolutionType[];
  business_types: BusinessType[];
  priority: number;                   // order within a filter
  one_liner: string;
  tells_you: string;
  costs: { time: string; setup: string; access: string };
  real_signal: string;
  weak_signal: string;
  best_when: string;
  example: string;
  failure_modes: string[];
  five_parts: {
    who: string; where: string; framing_hint: string; reading_hint: string;
  };
  actions: { key: string; label: string; strength: 'strong' | 'weak'; definition: string }[];
};
```

**Strong vs weak actions** (global definitions, shown wherever the user tags an action):
- **Strong** (joins the warm list): a reply with a specific experience, a sign-up, a booked call, a share with someone else, giving their time.
- **Weak** (does not): a like, a reaction, "sounds good".

A preset may add its own actions but each must be tagged strong or weak using these definitions.

**Schema additions** (also listed in `components-shared.md`): `OBSERVATION_FOCUS_OPTIONS.experiment: 'problem_test'` (replaces `offer_response`), `'warm'` as a `user_contacts` role, `project.metadata` keys above.

---

## `m3-setup` · `project_starting_point`

**Purpose.** Orient. No writes.

**Reads.** Project, opportunity, `project.metadata.approach`, `m3_question` (from M2), 2 or 3 conversation quotes (key quotes from `customer_interview` observations).

**UI.** Three blocks, all in the user's own words with EvidenceChips:
1. The problem and who has it.
2. How they said they'd help (approach) in their line, not the label alone.
3. What people said (two or three quotes).

Then the question they carried in ("You wanted to find out: …").

Then a short plain statement of what M3 is not: "You won't be selling anything or naming a price."

**Completion.** Always enabled.

---

## `m3-q1-setup` · `test_design_setup`

**Purpose.** Introduce the five parts. Read-only.

**UI.** The five parts as a simple five-step strip (who, where, framing, action, reading), each with one line. A small example from a different kind of problem (not the user's) so the structure is visible. Also one line: "Whatever channel you use, this stays the same."

**Writes.** None.

---

## `m3-q1-access` · `test_access_profile`

**Purpose.** Capture what the user can reach and is comfortable doing. No AI.

**Reads.** `programContext.network_context`, `programContext.resources`, M2 conversation contacts, M2 feasibility `access`.

**Questions** (one at a time, GuidedConversation style, but static):
1. **Where do the people who have this problem spend their time?** Free text with suggestions from `network_context` groups, M2 interviewees' context and M2 `access` answers. Each place can be tagged online / in person / both.
2. **What would you be comfortable doing?** Four rows, each yes / maybe / no: post publicly, message people you don't know, have conversations, put up a simple page.
3. **How much time do you have in the next week or two?** Hours per week and days available. Prefill from `resources` time.
4. **Would the people you'd help mostly find you online, in person, or both?** Sets `business_type` (confirm if it can be inferred from question 1).

**Writes.** `project.metadata.access_profile = { places [{ name, where: 'online'|'offline'|'both', channel? }], comfort { post_publicly, message_strangers, have_conversations, put_up_page }, time { hours_per_week, days } }` and `project.metadata.business_type`.

**Completion.** Questions 1, 2 and 4 answered. Question 3 optional.

**Gap note.** Business type was not captured in M2. If you later want it earlier, add it to `m2-q3-approach`.

---

## `m3-q1-cards` · `test_preset_cards`

**Purpose.** Let the user pick from a few known tests instead of a blank page.

**Reads.** `project.metadata.approach.primary` (solution type), `business_type`, `access_profile.comfort`, the preset library.

**Filtering.**
1. Presets where `solution_types` includes the project's solution type and `business_types` includes `business_type`.
2. Remove presets that need something the user said "no" to (for example a public post when `post_publicly = no`).
3. Order by `priority`. Show at most four.
4. If the approach was "I'm not sure yet", ask inline: "Which of these is closest to what you'd do first?" (the four ways of helping), save it back to `project.metadata.approach.primary`, then filter.

**UI.** Cards, one per preset: name, one line, what it tells you, what it costs you, what a real signal looks like, what a weak one looks like, best when. A **Design my own** link opens the five parts blank (same structure as the AI draft screen).

**Writes.** `project.metadata.chosen_preset_key` (or `'custom'`). No test row yet.

**Completion.** A card, or "Design my own", chosen.

**Preset content rule.** Presets must be **hand-raising tests**, never solution deliveries or price tests: the action is something like replying with an experience, signing up for early access, booking a short call, sharing it with someone, or joining a session. See the open point in the summary about concierge / Wizard-of-Oz style presets.

### Illustrative presets (content to be finalised)

| Key | Name (plain) | Solution type | Business type | Action examples |
|---|---|---|---|---|
| `describe_and_invite_call` | Describe the problem and offer a short call | do_for_them | any | Book a 15-minute call (strong), reply with an example (strong), like (weak) |
| `early_access_page` | A simple page that names the problem | tool | online, hybrid | Sign up for early access (strong), reply with an example (strong), visit only (reach) |
| `two_sided_post` | Post to both sides of the match | connect | online, hybrid | Reply or sign up on either side (strong), share with someone (strong) |
| `free_session_invite` | Invite people to one free session | teach | any | Register (strong), show up (strong), ask a follow-up question (strong), react (weak) |

Each needs the full `TestPreset` fields: costs, real signal, weak signal, best when, example, failure modes.

---

## `m3-q1-setup-test` · `test_setup_draft` — AI moment 1

**Purpose.** Produce the test design: the five parts, specific enough to run tomorrow.

**Reads.** The chosen preset (or blank), `project.metadata` (approach, access_profile), the opportunity, M2 conversations (key quotes with ids, `current_solution`, `cost`), M2 feasibility, `programContext`.

**Flow.**
1. If anything essential is missing, AI asks up to **two** short clarifying questions, one at a time. Otherwise skip.
2. AI drafts the five parts. Shown as five editable sections plus a scope line ("About {n} people over {d} days").
3. The user edits each. They can regenerate a single section.
4. The **flag**: if the draft cannot fail or will not give a real signal, show one calm message, once ("This test only asks for a like. Nobody can really say no to it. Want a version that asks for something more?") with **Show me an alternative** and **Keep mine**. Never blocks.
5. Save.

**AI contract.** `purpose 'test_setup_draft'`. Output (JSON):

```
{
  who:     { description, source, contact_ids? },
  where:   { channel, description },
  framing: { text, source_quote_ids: [] },
  action:  { label, strength, definition },
  reading: { reach, action, evidence },
  scope:   { people, days },
  flag:    null | { reason, alternative_preset_key }
}
```

Prompt rules (in addition to the shared mirror rules):
- **Framing is built from the user's own M2 quotes** and cites them. Never invent a quote.
- **Framing must answer the unspoken question "are you going to do something about this?"** It names the problem and signals the user is working on it. It must not read like a survey ("do you have this problem?") and must not describe or sell a solution or a price.
- The action must be a **hand-raise**, tagged strong or weak using the global definitions.
- `reading` states in plain words what counts as reach, action and evidence for this test.
- The flag is raised for: only weak actions available; an audience only of people likely to say yes (friends and family); no way to count reach; framing that describes a solution or price; scope too small to read (fewer than about 5 people).

**Writes.** Upsert the test observation (see Data model) with `status 'designed'`. Set `project.metadata.active_test_id`.

**Failure.** If AI fails, show the five blank parts pre-filled only with the preset's hints. The user can still proceed.

**Completion.** All five parts non-empty.

**Pass 2+.** When routed back from `m3-q2-action` or `m3-q3-action`, load the previous test's design as the starting point, show what changed from last time, and create a **new** test observation with `pass + 1` and `previous_test_id`. Never overwrite the earlier test.

---

## `m3-q1-reveal` · `test_design_reveal`

**Purpose.** Show the whole test and what a real signal looks like. Deterministic.

**UI.** The five parts as one summary, then a block "What would count":
- **Reach**: what counts as someone stopping.
- **Action**: the strong and weak actions for this test, using the global definitions.
- **Evidence**: the things you'll try to learn from anyone who acts.

If this is a second pass, also show "What you changed since last time".

**Writes.** None. **Completion.** Always enabled.

---

## `m3-q1-action` · `test_commit_action`

**Purpose.** Commit to running it, or revise.

**UI.** Two buttons: **I'll run this** and **Change something** (routes to `m3-q1-setup-test` with `nextNodeKey`). If committing, one more line: "When will you start?" (a date, defaults to today).

**Writes.** `test.metadata.test.status = 'committed'`, `committed_at`; `project.metadata.active_test_id`. A `follow_up` task is created for the start date (nudge on).

**Completion.** "I'll run this".

---

## `m3-q2-setup` · `test_run_setup`

**Purpose.** Set expectations for running and logging. Read-only.

**UI.** Short: the three levels with plain labels, how to log as things come in, "this takes days", and "an honest zero is a real result". A reminder of the user's own `reading` text.

**Writes.** None.

---

## `m3-q2-run` · `test_run_log`

**Purpose.** The real-world step. Run the test and log everything. **No AI.**

**Pacing.** `delay_days: 5`, not strict. Show the guidance line.

**Two states** (WorldTask):
1. **Go.** The design in a collapsible panel (five parts, the framing text with a copy button, who to start with). Button **I've started**, with date. This sets `status 'running'`, `started_at`, and creates two `follow_up` task nudges: one 3 days later ("Anything come back?") and one 5 days later.
2. **Back / log.** Opens with "What happened?". Three sections:

   **Did it land? (reach)**
   - "How many people did this get in front of?" (optional number and unit: messages sent, people who saw it, page visits).
   - "How many stopped, looked, clicked or read?" (required number).
   - Notes. The user can update these numbers any time; keep `entries` history.

   **Who did something? (action)**
   - **Add someone.** Name or handle (ContactPicker), how they got in touch (channel), what they did (the preset's actions plus "something else"), and a strong / weak toggle prefilled from the preset with the definitions shown inline.
   - Strong actions require a way to reach them (contact details). If the person is anonymous, allow saving as a response but mark `on_warm_list: false` with the reason "No way to reach them".

   **What did they tell you? (evidence)** Per person, all optional and free text, in their own words:
   - A recent time it happened.
   - How often.
   - What it costs them.
   - What they do about it now.
   - How bad it is for them.
   - The line that stuck with you.

   Also on the log: "Anyone here who has it **worse** than the rest?" (checkbox; sets `worst_case` candidates for M4).

**Writes.**
- Test observation: `status`, `started_at`, `ended_at`, `reach` (with `entries`).
- One response observation per person (see Data model).
- **Strong action → warm list**: upsert `user_contacts` with role `'warm'`. If the person already exists in `user_contacts` (for example a M2 interviewee), add the role. Set `on_warm_list: true` on the response.
- Mark any matching `follow_up` tasks done.

**Completion.** The test has started and reach has been logged, **including a logged 0** ("Nobody stopped") with a confirm: "I'm treating this as nobody stopping." This is a valid, honest result. Responses are optional.

**Edge cases.** Responses logged after the user has moved on are allowed and are included in later reveals. An observation about a person already logged updates it (upsert).

---

## `m3-q2-reveal` · `test_results_reveal`

**Purpose.** Show the raw results separated by level. Nothing is interpreted. Deterministic.

**UI.** Three sections:
- **Did it land**: exposed and stopped numbers, notes.
- **Who did something**: strong actions (with names and what they did) and weak actions separately, plus the count that joined the warm list. People who could not be reached are shown with their reason.
- **What they told you**: evidence lines per person, grouped by theme (a recent time, frequency, cost, workaround) with EvidenceChips to the person.

Below, collapsed: "What you said you'd look for" with the reading text from the design. Do not compare in this node.

**Writes.** None. **Completion.** Always enabled.

---

## `m3-q2-action` · `test_results_action`

**Purpose.** Read now, or run again.

**UI.** Two choices: **Read the signals** and **Run it again with a change**. For the second, one question: what would you change (framing, channel, audience, or the action)? Saved on the new test.

**Writes.**
- Read: `test.status = 'logged'`; continue.
- Run again: `nextNodeKey 'm3-q1-setup-test'`; create the next test pass as a copy of the design (see pass rules) with the intended change recorded in `metadata.test.intended_change`.

After a second pass has been run, when the user chooses to run again, show one line: "You've run it {n} times. Keep going?" with **Yes, run it again** and **No, read it**. This is a check, not a block.

**Completion.** A choice is made.

---

## `m3-q3-setup` · `signal_reading_setup`

**Purpose.** Frame reading as a skill. Read-only.

**UI.** The three-way split (what the signals show, what they might mean, what is still unclear) with one example sentence for each. A line: "You were there. Your read matters more than anyone else's."

**Writes.** None.

---

## `m3-q3-read` · `signal_reading` — AI moment 2

**Purpose.** Offer a read, and produce the **user's** interpretation.

**Reads.** The latest test (and any earlier passes), reach, responses and evidence, the reading criteria from the design, M2 conversation evidence, the user's context.

**Flow.**
1. *Optional* first reaction: "Before you see a read, what's your gut say?" (one line, skippable). Saves to `interpretation.first_reaction`. This avoids anchoring on the AI.
2. AI read appears in three clearly separated sections:
   - **What the signals show.** Facts and counts only. ("Twelve people stopped. Three did something. Two described a recent time it happened.")
   - **What they might mean.** Possibilities, never conclusions. ("The framing seems to have landed. Few people acted. That can mean the problem is recognisable but not urgent, or that the action was too big. Both are plausible.")
   - **What is still unclear.** The gaps. ("You don't know whether the three who acted have it as badly as the two who described it specifically.")
3. Each section has **Sounds right** and **Not quite** (opens an edit box). Corrections are stored.
4. **"What did you notice that a summary couldn't?"** (free text, with examples as placeholder: hesitation, that the three who acted were all friends of one person).
5. **"In your own words: what do you make of this?"** (required, one or two sentences). Where it conflicts with the AI read, the user's version wins everywhere downstream.

**AI contract.** `purpose 'signal_read'`, persisted in `ai_logs`, **regenerate** allowed (latest shown). Output:

```
{ shows: [...], might_mean: [...], unclear: [...] }
```

Prompt rules (plus shared mirror rules):
- Three sections only, never merged.
- `might_mean` always offers at least two plausible readings when evidence allows and uses language of possibility.
- **Never** say whether the problem is real, whether to continue, iterate or stop, and never reference routes (M2, M4, "go back").
- No "validated", "failed", or percentages presented as conversion rates. Counts only.
- State sample size plainly.
- Distinguish what people said from what they did.

**Writes.** `test.metadata.test.interpretation = { ai_read_log_id, section_feedback, noticed, first_reaction?, user_read }`; `status 'read'`.

**Failure.** If AI fails, show the raw numbers and quotes and ask for the user's read directly.

**Completion.** `user_read` filled.

---

## `m3-q3-reveal` · `signal_reading_reveal`

**Purpose.** State plainly where the user stands. **No new AI call.**

**Reads.** The test, responses, `interpretation`.

**Flow.**
1. Three blocks from stored data: **What the signals show** (counts), **What you take from it** (the user's own read), **What's still unclear** (from the AI read, as edited by the user).
2. **Which of these fits?** Four situations shown as cards. The system pre-highlights the closest with "This looks closest to…" and the user confirms or picks another.

   | State key | Situation |
   |---|---|
   | `confirmed_acting` | The problem looks real and people are acting on it |
   | `confirmed_not_acting` | The problem looks real, but nobody is acting |
   | `acting_vague` | People are acting, but the problem is still vague |
   | `neither` | Neither yet |

   **Suggestion rule** (config, user can override): let `strong` be strong actions, `depth` be the count of responses with a specific recent instance.
   - `strong ≥ 1` and `depth ≥ 2` → `confirmed_acting`
   - `strong ≥ 1` and `depth < 2` → `acting_vague`
   - `strong = 0` and (`depth ≥ 2` including M2 conversations) → `confirmed_not_acting`
   - otherwise → `neither`
3. If nobody acted (`strong = 0`), show a **diagnosis** from the reach numbers, as possibilities, and ask the user to pick the one that fits:
   - `stopped = 0` → "Nobody stopped. The framing may not have landed or reached the right people."
   - `stopped > 0`, `strong = 0` → "People stopped but nobody acted. The problem may not be urgent enough, or the ask may be too big."
   - `strong > 0`, `depth < 2` → "People acted but told you little. A second conversation would tell you more."
4. Plain line on sample size. If thin: "This is based on {n} people. It tells you something, not everything."

**Writes.** `test.metadata.test.state`, `diagnosis` (user-confirmed).

**Completion.** A situation is confirmed.

---

## `m3-q3-action` · `signal_route_action`

**Purpose.** Choose what happens next, with reasons in the user's own words.

**UI.** First, **"What are you taking from this?"** (free text, required). Then four routes:

| Route | What it does |
|---|---|
| **Move on to planning** | Sets `m3_result { route: 'forward', state, strong_action_count, thin }`. `thin` is true if strong actions < 3 or only one pass was weak. If thin, show once: "You're moving forward on a thin signal ({n} strong actions). That's allowed. Do you want to run it again first?" with two buttons. Continues to `m3-reveal`. |
| **Run a better test** | Asks what to change: framing, channel, audience, or the kind of test. Creates the next pass. Routes to `m3-q1-setup-test` (framing, channel, audience, action) or `m3-q1-cards` (kind of test) via `nextNodeKey`. After the second pass shows "You've run it {n} times. Keep going?" |
| **Look at a different opportunity** | Sets the project's opportunity to `parked` with the reason, records `m3_result { route: 'back_to_m2' }`, shows the set-aside opportunities with an explicit "Bring one back", routes to `m2-q3-action` via `nextNodeKey`. The project and its tests are kept as history. |
| **Stop for now** | `m3_result { route: 'paused' }`, creates a `follow_up` task with nudge, returns to the dashboard. The node stays incomplete. |

**Writes.** As above, plus `m3_takeaways: [{ text, at }]` appended on `project.metadata`.

**Completion.** A route and the takeaway. "Stop for now" does not complete the node.

**Note on the routes.** The "nobody acted" path is the most common and instructive. The reveal's diagnosis feeds the "Run a better test" question: if the diagnosis was framing, preselect "framing"; urgency → "the ask or the audience"; depth → "keep the test, talk to the people who acted".

---

## `m3-reveal` · `mission_transformation_synthesis`

**Purpose.** Tell the story. Deterministic, no AI.

**UI.** Plain sequence: the problem; who you put it in front of and where; how many stopped; who did something (names, what they did); what they told you (a few lines in their words); what you took from it (their `user_read` and takeaway); the transformation sentence matched to `state`:

- `confirmed_acting`: "You put your problem in front of real people. Some of them acted. You know it's real, and you have people waiting."
- `confirmed_not_acting` / `acting_vague` / `neither`: A plain statement of what is and isn't known, and what the user learned anyway. Never a positive spin.

If the signal was thin, say so, using the same sentence as in `m3-q3-action`.

**Writes.** None. **Completion.** Always enabled.

---

## `m3-action` · `mission_transfer_action`

**Purpose.** Hand off to M4.

**Flow.**
1. **The problem, in your words.** One or two sentences, prefilled from the opportunity and framing, editable. Saved to `project.metadata.confirmed_problem`.
2. **People who raised their hand.** The warm list with each person's action and a quote. The user can remove someone or add someone who acted offline (name, what they did, strong). Count shown.
3. **What they told you.** The evidence assembled in groups (recent instances, costs, workarounds, quotes), with "who has it worst" starred (`worst_case`). The user can star or unstar.
4. **"What do you most need to plan around?"** One line, saved to `project.metadata.m4_focus`.

**Writes.** `project.metadata.confirmed_problem`, `m4_focus`; `worst_case` flags on responses; warm list edits. Advances to `m4-setup`.

**Completion.** Problem text and `m4_focus` filled.

**Reachable only via the "Move on to planning" route.**

---

## What M4 reads from M3

- `confirmed_problem` and the original M2 problem.
- All `kind: 'response'` observations for the project (quotes, recent instances, costs, workarounds, `worst_case`).
- The warm list (`user_contacts` where `roles` includes `'warm'` and `metadata.warm_for_project_id = project.id`).
- `m4_focus`, `m3_result`, `approach`, the access profile and the final test design.

**M4 and M5 impact (not changed here).** M4 no longer inherits a tested offer or any price. Its setup, customer and offer nodes (`m4-q1-customer`, `m4-q1-offer`) read M3 evidence instead of "M3 market responses". The offer is designed in M4 and tested in M5 against the warm list as a pre-release signup. M4's setup dependency changes to `m3-action`.
