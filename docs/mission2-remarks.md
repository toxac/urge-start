# Draft mission 2
Things to do: 

- **Pass 1 (this message):** Full mission 2 spec — every node, in order, with all the detail we've decided plus the questions we still need to answer inline.
- **Pass 2:** Proposed data shape per node — what gets written, where, in what shape.
- **Pass 3:** Schema evaluation — what holds, what needs to change, what we can defer.

this is working document. Where a decision is made, it's stated. Where it's still open, it's marked **⚠ OPEN** so we can resolve it before Pass 2.

---

## Mission 2 — Discover Opportunities

**Key:** `mission-2`
**Sequence:** 2
**Question:** *What problems are worth building a business around?*
**Description:** You don't need to invent a brilliant business idea. You need to learn to notice problems, look closely, talk to people, and choose something worth working on.
**Transformation:**
- **From:** Looking for a business idea.
- **To:** I have observed problems, investigated them, talked to real people, and chosen one to test with evidence — not impulse.

**Pacing:** Spans ~2 weeks. Q1 requires a minimum observation period. Q4 action enforces a reflection pause. Other nodes are unpaced.

**Global context available to every node:**
- `user_program_context` (capabilities, experience, resources, motivations, barriers, quit conditions, network)
- `user_profile` (name, city, country, currency)
- `user_observations` (grows across the mission)
- `user_opportunities` (grows across the mission)
- `observation_links` (links observations to opportunities)
- All previous node progress

---

### Mission Setup

**Key:** `m2-setup`
**Role:** setup
**Title:** Where are you starting from?
**Component:** `opportunity_starting_point` (working name)

**Intent:** Acknowledge that most users arrive with an idea, invite them to bring it, save it as an opportunity, and frame the mission around it.

**Description:**

> Most people who want to start a business already have an idea in mind. Or the ghost of one. This mission doesn't ask you to set that aside. It invites you to bring it and apply a practice to it: noticing problems, investigating them, and choosing with evidence.
>
> If you already have an idea, we'll save it and revisit it at the end of this mission — alongside anything new you discover. If you don't, that's fine too. You'll find one.

**Prompt (conditional):**

- If user has an idea: *"What's the idea you've been carrying?"*
- If user has no idea: *"What made you decide to start a business now?"*

**Behavior:**

1. Detect whether the user mentions an idea in their `start_drive` (M1 setup) or is entering fresh.
2. If they have one, show a form to save it as an opportunity:
   - **Title** (required)
   - **Description** (optional)
   - **Problem** (optional) — what problem does it solve?
   - **Customer** (optional) — who has this problem?
   - **Hypothesis** (optional) — why do you think it will work?
3. Write `user_opportunities` row with `status = 'added'`.
4. Store the reference in mission progress so later nodes can display it.
5. If they don't have an idea, show the mission framing and proceed without writing anything.

**⚠ OPEN:** Should the user's pre-existing idea be exempt from Q2/Q3 filtering? Or does it go through the same pipeline? My read: same pipeline. It enters at Q1 action as already-promoted, but Q2 and Q3 apply normally. Otherwise the user keeps something they shouldn't just because they arrived with it.

**Writes:** `user_opportunities` (one row, if user has an idea).

---

### Quest 1 — Notice Problems

**Key:** `q1`
**Title:** Notice Problems
**Description:** Stop trying to manufacture ideas. Pay attention to problems that are already happening around you.

**Pacing:** Quest spans ~1 week. Q1 Inv 1 enforced with `min_days: 5`, mode `confirm` — the user is warned before moving on if they haven't spent enough days observing.

---

#### Q1 Setup

**Key:** `m2-q1-setup`
**Role:** setup
**Title:** Where opportunities actually come from.
**Component:** `observation_setup` (working name)

**Intent:** Reframe opportunity discovery. Not brainstorming ideas — noticing problems.

**Description:**

> Every business, no matter how big, exists to solve a problem. Some problems are obvious. Some are hidden in plain sight. The best founders don't invent problems — they notice ones that already exist.
>
> In this quest, you'll build the practice of noticing. Not by brainstorming, but by paying attention to the problems around you — in your own life, in the lives of people you know, in the world as it changes, and in what you already know from experience.
>
> Don't filter yet. Don't ask whether something is a business. Just notice.

**Prompt:** *"What problems have you noticed that are worth looking at?"*

**Behavior:** Framing only. No writes.

**Dependencies:** `m2-setup`

---

#### Q1 Investigation 1 — Capture Observations

**Key:** `m2-q1-observe`
**Role:** investigation
**Title:** What problems are you noticing?
**Component:** `observation_capture` (working name)

**Intent:** Give the user a lightweight, ongoing way to capture observations as they arise — across sources, without turning it into an academic exercise.

**Description:**

> This is a living space. Come back whenever you notice something. Add what you saw, heard, or experienced.
>
> You don't need to know if it's a business idea. You don't need to know if it's important. Just capture it. You can add detail later.

**Behavior:**

1. **Capture surface** — a single component with a short prompt and a "log observation" trigger.
2. **Prompt phrases** — contextual, relatable, not academic. Each opens the LogObservation dialog with `type`, `domain`, `focus` pre-filled:

   | Prompt | focus |
   |---|---|
   | What frustrated you today? | `personal` |
   | What did someone around you complain about? | `people` |
   | What did you see someone struggle with? | `zone_of_influence` |
   | What's changing that might create new problems? | `changes` |
   | What problems are showing up in a market you're exploring? | `markets` |

   All under `type = 'observation'`, `domain = 'problem'`.

3. **LogObservation dialog** — universal fields, minimum viable required:

   **Required (minimum viable):**
   - Problem (one-sentence title)
   - Content (free text: what you saw, heard, experienced)
   - Who has it (name, role, or group)
   - What they do now (current workaround)

   **Optional (add detail):**
   - Cost (time, money, stress)
   - Frequency (daily / weekly / monthly / yearly)
   - Why it's unsolved
   - Whether you can reach them
   - Why outsiders miss it (relevant for `experience`)
   - What you understand about it (relevant for `experience`)
   - Domain or experience context
   - Whether you have credibility here
   - Remarks

   **Auto-filled defaults:** `type`, `domain`, `focus`, `source_node_key` (`m2-q1-observe`).

4. **AI exploration hints** — an optional button: *"What should I look for?"*
   - Reads mission context, user profile, user context, and saved observations.
   - Returns 3–5 concrete prompts: *"You've noticed a few problems in education. Have you looked at how teachers handle X?"*
   - Hints are guidance, not requirements. They do not auto-create observations.
   - Logged in `ai_logs` with `purpose = 'observation_hints'`, `component_key`, `source_node_key`.

5. **Observation display** — list of all observations saved so far, with:
   - Title, focus tag, timestamp
   - **Complete** badge if all minimum-viable fields are filled
   - **Incomplete** badge with "missing: X, Y" hint if not
   - Click to edit (reopens LogObservation dialog)

6. **Completion threshold** — 10 observations with minimum-viable fields filled.
   - If user reaches 10 and taps Continue → soft confirmation: *"Most people need more than 10 to see real patterns. You can continue, or keep observing."*
   - If user has fewer than 10 → continue is disabled with a message.

**Pacing:**
- `mode: 'confirm'`
- `min_days: 5`
- `guidance: "Observation works best over time. Come back on at least 5 different days before continuing."`

**Writes:** `user_observations` rows (multiple).

**Dependencies:** `m2-q1-setup`

**⚠ OPEN:**
- Should observations be writable outside this node (across the mission)? Users may notice something during Q2 or Q3. My read: yes — observations can be added anywhere in the mission, but Q1 Inv 1 is where the practice is introduced and where the 10-observation floor applies.
- The pre-existing opportunity from M2 setup — should it also appear as an observation? My read: no. It lives as an opportunity from the start.

---

#### Q1 Investigation 2 — Qualify Observations

**Key:** `m2-q1-qualify`
**Role:** investigation
**Title:** Which of these are real, and which matter to you?
**Component:** `observation_qualification` (working name)

**Intent:** Apply two flags to every observation: is it real, and does it matter to you.

**Description:**

> You have a list of problems. Not all of them are worth your attention.
>
> Two questions help you filter. First: is this real? Does it actually happen, to real people, often enough and costly enough to matter? Second: does it matter to you? Do you want to keep thinking about this? Would you still care if no one paid you?
>
> Be honest with both. A problem you don't care about will exhaust you. A problem that isn't real will waste you.

**Prompt:** *"For each observation — is it real, and does it matter to you?"*

**Behavior:**

1. **Card list** — one card per observation. Each card shows:
   - Title, focus tag, brief content
   - Current qualification status (unqualified / qualified / maybe)
   - Click to open qualification dialog

2. **Qualification dialog** — two flags:
   - **Is it real?** yes / maybe / no
   - **Does it matter to me?** yes / maybe / no

   Both flags saved to `user_observations.metadata.qualification`:
   ```
   {
     "qualification": {
       "real": "yes" | "maybe" | "no",
       "care": "yes" | "maybe" | "no",
       "qualified_at": "timestamp"
     }
   }
   ```

3. **Continue** enabled when every observation has both flags.

**Pacing:** Displayed only. `guidance: "Take a moment with each. No rush."`

**Writes:** `user_observations.metadata.qualification` per observation.

**Dependencies:** `m2-q1-observe`

**⚠ OPEN:**
- Should the user be able to re-qualify after Q1 Reveal (in light of AI patterns)? My read: yes — the reveal should offer a "revisit qualification" path. But the button lives in Q1 Reveal, not here.

---

#### Q1 Reveal

**Key:** `m2-q1-reveal`
**Role:** reveal
**Title:** What keeps showing up?
**Component:** `observation_patterns_reveal` (working name)

**Intent:** Surface patterns across observations using AI, grounded in user context. Show what the user's own qualification may have missed.

**Description:**

> Look across everything you noticed. Some problems repeat. Some cluster. Some connect to things you already know or have lived through.
>
> Here's what showed up.

**What the reveal shows:**

1. **Patterns** — AI identifies themes, clusters, recurring problems. Presented as observations the user actually made, grouped.
   - *"3 problems related to X."*
   - *"You noticed this problem from two different angles — personal and people around you."*

2. **Intersections** — where sources overlap. *"Personal + experience."* *"Trends + people around you."*

3. **What your qualification didn't flag** — observations the user marked as `maybe` or `no`, but which connect to other observations in a way they might want to reconsider.
   - Framed as *"You marked this as no, but it shows up in three other places."*
   - Offer: *"Worth a second look?"*
   - Never forces a change.

4. **User context assessment** — AI connects observations to the user's capabilities, experience, motivations, and network.
   - *"This problem overlaps with your experience in X."*
   - *"You have network access in Y that could help you learn more about this."*
   - *"This aligns with your motivation to Z."*

5. **Re-qualification prompt** — a button: *"Revisit your qualification."* Takes the user back to Q1 Inv 2 to adjust flags if they want.

**AI call logged** in `ai_logs` with `purpose = 'observation_patterns'`.

**⚠ OPEN:**
- Should patterns be persisted (a table) or generated fresh each time? My read: fresh each time, logged in `ai_logs`. Persistence adds complexity for little gain — the observations themselves are the source of truth.

**Dependencies:** `m2-q1-qualify`

---

#### Q1 Action

**Key:** `m2-q1-action`
**Role:** action
**Title:** Which problems will you take forward?
**Component:** `promote_to_opportunities` (working name)

**Intent:** Promote qualified observations to opportunities.

**Description:**

> Not every problem becomes an opportunity. Now you choose which ones you want to look at more closely.
>
> You don't have to pick only one. You can bring several forward and narrow later.

**Prompt:** *"Which of these problems will you take forward?"*

**Behavior:**

1. **List of qualified observations** — observations where `real ≠ no` AND `care ≠ no`.
2. **Each item can be toggled** — promote to opportunity (default on) or leave as observation only.
3. **Continue** → for each promoted observation, create a `user_opportunities` row:
   - `title` — observation title
   - `description` — observation content
   - `problem` — the problem statement
   - `customer` — derived from "who has it"
   - `metadata.source_observation_id` — link back
   - `status = 'added'`
4. **Observation link** created: `observation_links` row with `entity_type = 'opportunity'`, `relationship = 'source'`.
5. **Soft warning** if promoting more than 8: *"You're bringing 12 forward. That's fine, but Q2 and Q3 get heavier with each one. Consider focusing on your top 6–8."*
6. **Pre-existing opportunity** from mission setup — shown in the same list, marked as "already added". User can keep or remove.

**Writes:**
- `user_opportunities` rows
- `observation_links` rows

**Dependencies:** `m2-q1-reveal`

**⚠ OPEN:**
- When a pre-existing opportunity (from mission setup) is kept, does it also need an observation to link to? My read: no — some opportunities arrive without observations. The link table allows this.

---

### Quest 2 — Can I Do Anything About It?

**Key:** `q2`
**Title:** Can I Do Anything About It?
**Description:** An interesting problem is not the same as a solvable one. Look honestly at what you would actually need.

**Pacing:** No enforced minimum. Suggested spread: 2–3 days. `guidance: "This isn't a quick yes/no. Take time with each."`

---

#### Q2 Setup

**Key:** `m2-q2-setup`
**Role:** setup
**Title:** Solvable is not the same as interesting.
**Component:** `feasibility_setup` (working name)

**Intent:** Shift the question from "does this problem matter?" to "could I realistically solve this?"

**Description:**

> You have a set of problems worth looking at. Now the harder question: are you in a position to actually do something about any of them?
>
> This doesn't mean you need to be an expert. It doesn't mean you need to know how to build. It means: do you know enough, or can you learn enough, and do you have access to the people, tools, or resources that would help you solve this?
>
> Some of these will have a path. Some won't. Both are useful to know.

**Prompt:** *"Which of these could you realistically work on?"*

**Behavior:** Framing only.

**Dependencies:** `m2-q1-action`

---

#### Q2 Investigation 1 — What Do I Know and Need?

**Key:** `m2-q2-know`
**Role:** investigation
**Title:** What do you already know, and what would you need?
**Component:** `feasibility_self_assessment` (working name)

**Intent:** Per opportunity, assess the user's current knowledge and identify what's missing.

**Description:**

> For each opportunity, look at what you already know and what you'd need to learn. Not to judge yourself — to see the path, or the absence of one.

**Prompt:** *"What do you know, and what would you need?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog with three sections:

   **A. What do I already know about this domain?**
   - Free text.
   - Context shown: M1 capability inventory, experience inventory.
   - Prompt: *"What have you done, learned, or read that relates to this?"*

   **B. What would I need to learn, and how long would that realistically take?**
   - Free text.
   - Prompt: *"What's the gap? Weeks? Months? Years?"*

   **C. Who would I need access to — customers, suppliers, experts, partners?**
   - Free text.
   - Context shown: M1 network inventory.
   - Prompt: *"Who do you know, or who could you reach, that would matter here?"*

2. **Save to observation:** each answer creates or updates a `user_observations` row:
   - `type = 'research'`
   - `domain = 'problem'`
   - `focus = 'feasibility_self'`
   - `content` = the answer
   - `metadata.opportunity_id` = the opportunity
   - `metadata.section` = `'domain'` | `'learning'` | `'access'`
   - `observation_links` row with `entity_type = 'opportunity'`, `relationship = 'feasibility_self'`

**Writes:**
- `user_observations` rows (one per section per opportunity)
- `observation_links` rows

**Dependencies:** `m2-q2-setup`

**⚠ OPEN:**
- Three observations per opportunity feels heavy. Alternative: one observation per opportunity with three sections in `metadata`. But then the reveal can't query across opportunities by section. My read: three observations. It's cleaner.
- Can the user skip an opportunity? My read: no. The point is to look at each honestly.

---

#### Q2 Investigation 2 — Hidden Difficulty and Adjacent Solutions

**Key:** `m2-q2-research`
**Role:** investigation
**Title:** What's hidden, and who's done something like this?
**Component:** `feasibility_research` (working name)

**Intent:** Per opportunity, look for what the user can't yet see, and find who has solved something adjacent.

**Description:**

> Every problem has hard parts you can't see yet. The way to find them is to look at who has tried something similar — and ask what they hit.
>
> You're not looking for competitors. You're looking for lessons.

**Prompt:** *"What's harder than it looks, and who's been here before?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog with two sections:

   **A. What are the hard parts I can't yet see?**
   - Free text.
   - Prompt: *"Talk to someone who's done this, or search for others who tried. What surprised them? What killed similar attempts?"*
   - Suggested sources: adjacent industries, forum threads, interviews, case studies, review complaints.

   **B. Who has solved something adjacent that I could learn from?**
   - Free text.
   - Prompt: *"Name them, and note what specifically you'd want to learn."*

2. **Save to observation:** each answer creates a `user_observations` row:
   - `type = 'research'`
   - `domain = 'problem'`
   - `focus = 'feasibility_research'`
   - `metadata.opportunity_id` = the opportunity
   - `metadata.section` = `'hidden_difficulty'` | `'adjacent_solutions'`

**Writes:**
- `user_observations` rows
- `observation_links` rows

**Dependencies:** `m2-q2-know`

---

#### Q2 Investigation 3 — Smallest Deliverable Brainstorm

**Key:** `m2-q2-brainstorm`
**Role:** investigation
**Title:** What's the smallest version you could deliver?
**Component:** `smallest_deliverable_brainstorm` (working name)

**Intent:** Guided brainstorm. Show that there are many ways to solve the same problem, and that a first version doesn't have to be the full solution.

**Description:**

> There's almost never one way to solve a problem. You don't have to start with the biggest version.
>
> A solution can be manual. It can be done by hand for one person. It can be a spreadsheet, a phone call, a service. It can be a service pretending to be a product until it doesn't need to pretend anymore.
>
> For each opportunity, sketch the smallest version you could deliver to someone in weeks, not years.

**Prompt:** *"What's the smallest thing you could deliver?"*

**Behavior:**

1. **One card per opportunity.** Click → guided brainstorm:
   - **Step 1:** List 3 ways you could solve this. Any three. Big, small, weird, obvious.
   - **Step 2:** For each, ask: *"What's the smallest version of this you could deliver in 2 weeks?"*
   - **Step 3:** Pick one as your candidate smallest version, or write your own.

2. **Save to observation:** one `user_observations` row per opportunity:
   - `type = 'research'`
   - `domain = 'problem'`
   - `focus = 'feasibility_smallest'`
   - `metadata.opportunity_id` = the opportunity
   - `metadata.options` = the 3 sketches
   - `metadata.chosen` = the smallest version

**Writes:**
- `user_observations` rows
- `observation_links` rows

**Dependencies:** `m2-q2-research`

**⚠ OPEN:**
- Should AI suggest the 3 options? My read: offer as an optional button. Some users will want the prompt; some will want to think themselves.
- What if the user can't think of any smallest version? Offer a "skip for this opportunity" path — but flag it in the reveal as a feasibility gap.

---

#### Q2 Reveal

**Key:** `m2-q2-reveal`
**Role:** reveal
**Title:** Where do you actually have a path?
**Component:** `feasibility_reveal` (working name)

**Intent:** Show how each opportunity looks against the user's resources, expertise, time, and access.

**What the reveal shows:**

1. **Per opportunity, a summary:**
   - What you know about the domain
   - What you'd need to learn (with rough time)
   - Who you'd need access to — and whether you have it
   - Hidden difficulty (if surfaced)
   - Adjacent solutions you can learn from
   - Smallest deliverable candidate

2. **Comparison** — which opportunities the user has a clear path on, which are uncertain, which look out of reach.

3. **AI assessment** — connects the above to `user_program_context`:
   - *"Your experience in X maps directly to opportunity Y."*
   - *"You said access to suppliers was a gap for Z. You have two contacts in your network who might help."*
   - *"The learning path for opportunity W is longer than your stated time availability."*

4. **Fair warning about the pivot** — if the user arrived with a pre-existing idea and it's now looking out of reach, this reveal should say so gently:
   - *"Your original idea is looking harder than it seemed. That's normal. The question isn't 'is it possible?' but 'is this the right thing to do first?'"*

**AI call logged** with `purpose = 'feasibility_assessment'`.

**Dependencies:** `m2-q2-brainstorm`

---

#### Q2 Action

**Key:** `m2-q2-action`
**Role:** action
**Title:** Can you do this?
**Component:** `feasibility_filter` (working name)

**Intent:** Yes/no decision per opportunity. No → parked.

**Description:**

> One question for each: can you do this?
>
> Not "could anyone?" Not "eventually?" Could you, with what you have and what you can realistically learn or access, do something about this?
>
> Answer honestly. A no is not a rejection of the problem. It's a decision about where you'll spend your time.

**Prompt:** *"Can you do this — yes or no?"*

**Behavior:**

1. **One card per opportunity**, each with:
   - Summary (from reveal)
   - Yes / No toggle
   - Optional note: *"Why?"* (short text, saved to `metadata.can_i_solve_note`)

2. **Save** to `user_opportunities.metadata`:
   ```
   {
     "can_i_solve": "yes" | "no",
     "can_i_solve_note": "...",
     "can_i_solve_at": "timestamp"
   }
   ```

3. **Status update:**
   - `yes` → opportunity stays active, `status` unchanged
   - `no` → `status = 'parked'`

4. **Confirm** — before continuing, show a summary:
   - *"You're taking X opportunities forward. Y are parked."*
   - Parked opportunities are shown but not editable here.

**Writes:**
- `user_opportunities.metadata.can_i_solve`
- `user_opportunities.status`

**Dependencies:** `m2-q2-reveal`

**⚠ OPEN:**
- Should parked opportunities be visible later? My read: yes, in a "parked" view. They may become relevant if Q3 or Q4 narrows the field.
- Can the user un-park? My read: yes, but only explicitly. Not in the normal flow.

---

### Quest 3 — Is This Worth Solving as a Business?

**Key:** `q3`
**Title:** Is This Worth Solving as a Business?
**Description:** A solvable problem can still be a bad business. Test whether money, market, and timing work.

**Pacing:** Suggested spread: 3–4 days. `guidance: "This is desk work. Give it real time."`

---

#### Q3 Setup

**Key:** `m2-q3-setup`
**Role:** setup
**Title:** Solvable is not the same as worth solving.
**Component:** `viability_setup` (working name)

**Intent:** Frame the shift from "I can do this" to "should this exist as a business?"

**Description:**

> You now have a set of problems you can do something about. That's meaningful.
>
> But a solvable problem is not automatically a business. Some problems have no one willing to pay for them. Some have plenty of payers but no way to reach them. Some are the right problem at the wrong time.
>
> Now you test whether money, market, and timing work. This is desk work — reading, searching, checking. Look for evidence, not opinion.

**Prompt:** *"Is this worth solving as a business?"*

**Behavior:** Framing only.

**Dependencies:** `m2-q2-action`

---

#### Q3 Investigation 1 — The Payer

**Key:** `m2-q3-payer`
**Role:** investigation
**Title:** Who pays, and how much?
**Component:** `viability_payer` (working name)

**Intent:** Per opportunity, identify who pays, what they currently spend, and whether the problem is a painkiller or a vitamin.

**Description:**

> Start with the payer. Not the person who has the problem — the person who would actually open their wallet.
>
> Sometimes it's the same person. Sometimes it's their boss, their spouse, their government. Find out.

**Prompt:** *"Who pays, and what do they currently spend?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog with three sections:

   **A. Who pays?**
   - Free text.
   - Prompt: *"Is the payer the same as the person with the problem? If not, who?"*
   - Evidence hint: competitor pricing pages, forum discussions, industry reports.

   **B. How much would they pay — or what do they currently spend?**
   - Free text.
   - Prompt: *"What's the current spend on alternatives? Workarounds count."*
   - Evidence hint: pricing pages, complaints about cost, what they've bought.

   **C. Is this a painkiller or a vitamin?**
   - Single-select: `painkiller` / `vitamin` / `unclear`
   - Prompt: *"Painkillers get bought immediately. Vitamins get postponed forever."*
   - Evidence hint: how urgently do people talk about it? Do they act or postpone?

2. **Save** — one `user_observations` row per section:
   - `type = 'research'`
   - `domain = 'market'`
   - `focus = 'viability_payer'`
   - `metadata.opportunity_id`
   - `metadata.section` = `'payer'` | `'spend'` | `'painkiller'`
   - `metadata.confidence` = low / medium / high
   - `metadata.source` = free text
   - `metadata.gaps` = free text

**Writes:**
- `user_observations` rows (3 per opportunity)
- `observation_links` rows

**Dependencies:** `m2-q3-setup`

---

#### Q3 Investigation 2 — The Market

**Key:** `m2-q3-market`
**Role:** investigation
**Title:** How many, and can you reach them?
**Component:** `viability_market` (working name)

**Intent:** Per opportunity, assess market size and reachability.

**Description:**

> Now the market. Not in a way that requires a business degree — just enough to know whether the people you'd sell to actually exist, and whether you can get to them.
>
> Ten customers you can name beats one million you can't reach.

**Prompt:** *"How many people have this problem, and can you reach them?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog with two sections:

   **A. How many of these people exist?**
   - Free text.
   - Prompt: *"Rough numbers are fine. Search volume, community size, job postings, industry data."*
   - Evidence hint: Google Trends, subreddit size, job board counts, competitor user numbers, industry reports.

   **B. Can I reach them?**
   - Free text.
   - Prompt: *"Where do they gather? Do you have a path to the first 10? 100? Do you know anyone who could introduce you?"*
   - Context shown: M1 network inventory.

2. **Save** — one `user_observations` row per section:
   - `type = 'research'`
   - `domain = 'market'`
   - `focus = 'viability_market'`
   - `metadata.opportunity_id`
   - `metadata.section` = `'size'` | `'reach'`
   - `metadata.confidence`, `metadata.source`, `metadata.gaps`

**Writes:**
- `user_observations` rows (2 per opportunity)
- `observation_links` rows

**Dependencies:** `m2-q3-payer`

---

#### Q3 Investigation 3 — The Competition

**Key:** `m2-q3-competition`
**Role:** investigation
**Title:** Who else solves this?
**Component:** `viability_competition` (working name)

**Intent:** Per opportunity, identify competitors, substitutes, and gaps.

**Description:**

> Someone is already solving this — or pretending to. Sometimes the competitor is another business. Sometimes it's a spreadsheet, an intern, or doing nothing.
>
> Find them. Look at what they do well, and where they fail.

**Prompt:** *"Who else solves this, and where are they weak?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog with one section, repeated:

   **Who else solves this?**
   - List of competitors/substitutes (add rows)
   - For each: name, type (direct / substitute / "doing nothing"), strengths, weaknesses, price
   - Prompt: *"Direct competitors, substitutes, and the option to do nothing. All three matter."*
   - Evidence hint: competitor sites, review sites, forum discussions about alternatives.

2. **Save** — one `user_observations` row per opportunity with all competitors in metadata:
   - `type = 'research'`
   - `domain = 'competition'`
   - `focus = 'viability_competition'`
   - `metadata.opportunity_id`
   - `metadata.competitors` = array of `{ name, type, strengths, weaknesses, price }`
   - `metadata.confidence`, `metadata.source`, `metadata.gaps`

**Writes:**
- `user_observations` rows (1 per opportunity)
- `observation_links` rows

**Dependencies:** `m2-q3-market`

**⚠ OPEN:**
- Should competitors be their own table? My read: no for now. Metadata array is enough for a first pass.

---

#### Q3 Investigation 4 — Synthesis

**Key:** `m2-q3-synthesis`
**Role:** investigation
**Title:** What would need to be true?
**Component:** `viability_synthesis` (working name)

**Intent:** Per opportunity, pull the above together. Force a synthesis.

**Description:**

> You've looked at the payer, the market, and the competition. Now bring it together.
>
> Not every business needs to be huge. Not every business needs to be easy. But every business needs a few things to be true for it to work. What would have to be true for this one?

**Prompt:** *"What would need to be true for this to be a business?"*

**Behavior:**

1. **One card per opportunity.** Click → dialog:
   - **Prompt:** *"What would have to be true for this to be a business, not a hobby?"*
   - Free text.
   - Show the user's previous answers (payer, market, competition) as context, side by side.
   - Prompt sub-questions to guide:
     - *"What's the riskiest assumption?"*
     - *"What would kill this fastest?"*
     - *"What would need to be true in 6 months for you to still be working on it?"*

2. **Save** — one `user_observations` row per opportunity:
   - `type = 'research'`
   - `domain = 'market'`
   - `focus = 'viability_synthesis'`
   - `metadata.opportunity_id`
   - `metadata.riskiest_assumption`, `metadata.kill_conditions`, `metadata.six_month_test`

**Writes:**
- `user_observations` rows
- `observation_links` rows

**Dependencies:** `m2-q3-competition`

---

#### Q3 Reveal

**Key:** `m2-q3-reveal`
**Role:** reveal
**Title:** The viability matrix.
**Component:** `viability_matrix_reveal` (working name)

**Intent:** Show opportunities side by side against all six criteria.

**What the reveal shows:**

1. **Matrix view** — opportunities as columns, criteria as rows.
   - Rows: Payer, Spend, Painkiller vs Vitamin, Market Size, Reachability, Competition, Synthesis
   - Cells: user's answers, color-coded by confidence (low / medium / high)

2. **Evidence strength** — which opportunities have the most complete evidence and which have the most gaps.

3. **AI assessment** — grounded in user context:
   - *"Opportunity A has strong payer evidence but unclear reachability."*
   - *"Opportunity B's competition is heavy. Your differentiation would need to be sharper."*
   - *"Opportunity C has the strongest signal across all criteria."*

4. **Not a verdict** — the reveal explicitly does not declare a winner. It presents evidence, highlights gaps, and lets the user choose.

**AI call logged** with `purpose = 'viability_matrix'`.

**Dependencies:** `m2-q3-synthesis`

---

#### Q3 Action — Shortlist

**Key:** `m2-q3-action`
**Role:** action
**Title:** Which three will you investigate further?
**Component:** `shortlist_action` (working name)

**Intent:** Rank and shortlist up to 3 opportunities for Q4.

**Description:**

> You can't talk to customers about everything. Choose up to three of these to take into Q4, where you'll validate them with real people.
>
> Pick the ones with the strongest evidence, the ones that interest you most, and the ones you could actually pursue. Sometimes those are the same. Sometimes they're not.

**Prompt:** *"Which three will you take into the interviews?"*

**Behavior:**

1. **All active opportunities displayed** — sorted by any order the user prefers (they can reorder).
2. **User selects up to 3.** No more than 3 can be selected.
   - If user has fewer than 3 active opportunities, all are selected automatically.
   - If user has 1 or 2, the shortlist is what it is. Q4 proceeds with fewer.
3. **Save:**
   - Selected → `status = 'shortlisted'`
   - Others → `status = 'parked'`
4. **Confirm screen** shows what's shortlisted and what's parked.

**Writes:**
- `user_opportunities.status`

**Dependencies:** `m2-q3-reveal`

**⚠ OPEN:**
- What if the user has 1 active opportunity and it's weak? My read: proceed anyway. Q4 will reveal more. The mission shouldn't block on quality — it should reveal it.

---

### Quest 4 — Validate with Real People

**Key:** `q4`
**Title:** Validate with Real People
**Description:** Don't pick on impulse. Talk to real people first and let what you hear inform the choice.

**Pacing:** Spans ~3–5 days. Q4 action enforced with `min_days: 2`, mode `confirm`.

---

#### Q4 Setup

**Key:** `m2-q4-setup`
**Role:** setup
**Title:** Before you pick — talk to someone.
**Component:** `validation_setup` (working name)

**Intent:** Frame the shift from desk research to real conversations.

**Description:**

> You have up to three shortlisted opportunities. Your instinct probably already knows which one you'd pick.
>
> Don't pick on instinct. Talk to real people first — one per opportunity, or however you can arrange it. Fifteen minutes each is enough. You're not validating an offer. You're checking whether the problem is real to the people who live with it.

**Prompt:** *"Who will you talk to?"*

**Behavior:** Framing only.

**Dependencies:** `m2-q3-action`

---

#### Q4 Investigation — Interviews

**Key:** `m2-q4-interviews`
**Role:** investigation
**Title:** What do real people say?
**Component:** `customer_interviews` (working name)

**Intent:** Run conversations with real people who have each shortlisted problem. Capture structured and freeform.

**Description:**

> Talk to at least one person per shortlisted opportunity. If you can do more, do more. But one real conversation per opportunity is better than none.

**Prompt:** *"Talk to someone who has this problem."*

**Behavior:**

1. **One card per shortlisted opportunity.** Each card shows:
   - Opportunity name and problem
   - Number of interviews logged
   - Minimum one required

2. **Log interview** — opens a dialog:
   - **Interviewee** — name, context (name optional, context required)
   - **The six questions** — structured, one input per question, plus notes:
     1. Walk me through the last time this happened. → *specificity, recency, detail*
     2. How often does this come up? → *frequency*
     3. What do you do about it now? → *workarounds, current spend*
     4. What does it cost you? → *time, money, stress, concrete numbers*
     5. What have you tried? Why did you stop? → *underserved signal*
     6. Who else has this problem? → *reachability*
   - **Key quote** — free text (one quote)
   - **Surprises** — free text
   - **Freeform notes** — free text
   - **Weak signal field:** *Would you pay for this?* — captured but labeled *"weak signal, don't rely on this"*

3. **Save** — one `user_observations` row per interview:
   - `type = 'conversation'`
   - `domain = 'customer'`
   - `focus = 'customer_interview'`
   - `title` — e.g. *"Interview: Priya, bakery owner"*
   - `content` — freeform notes
   - `metadata.interview`:
     ```
     {
       "opportunity_id": "...",
       "interviewee": { "name": "...", "context": "..." },
       "answers": {
         "last_time": "...",
         "frequency": "...",
         "current_solution": "...",
         "cost": "...",
         "tried_before": "...",
         "others_with_problem": "..."
       },
       "would_pay": "...",
       "key_quote": "...",
       "surprises": "..."
     }
     ```
   - `observation_links` row with `entity_type = 'opportunity'`, `relationship = 'interview'`

4. **Alternate path — Google Form** — a secondary button: *"Prefer to collect answers via form?"*
   - Generates a Google Form link with the six questions.
   - User shares it, collects responses, then pastes them back into the interview dialog.
   - Same save format.

5. **Continue enabled** when every shortlisted opportunity has at least 1 interview.

**Writes:**
- `user_observations` rows (1 per interview)
- `observation_links` rows

**Dependencies:** `m2-q4-setup`

**⚠ OPEN:**
- Should we require at least 1 interview per opportunity, or allow a "skip" path? My read: require. The whole point of Q4 is to talk to real people.
- The `focus` value `customer_interview` — is this a valid value in the `OBSERVATION_FOCUS_OPTIONS`? Currently only `asking` is defined for experiments, and the problem-related ones for problems. Need to extend. **Schema change.**

---

#### Q4 Reveal

**Key:** `m2-q4-reveal`
**Role:** reveal
**Title:** What did you hear?
**Component:** `interviews_reveal` (working name)

**Intent:** Compare what the user heard against what they expected. Show per-opportunity signal.

**What the reveal shows:**

1. **Per opportunity:**
   - Interviews conducted
   - **Confirmed** — what matched the user's assumptions from Q3
   - **Contradicted** — what surprised them
   - **Unclear** — what nobody answered or the sample missed
   - Signal strength indicator

2. **Comparison across opportunities:**
   - Which has the strongest signal
   - Which had the biggest gap between desk research and conversation
   - Which the user reported the most surprises in

3. **AI assessment** — grounded in user context:
   - *"You assumed X, but every interviewee said Y."*
   - *"Opportunity B's interviews consistently contradicted your desk research on pricing."*
   - *"Opportunity C had the clearest signal, but you seemed most energised talking about A."* (Uses tone/content signals from their notes — optional.)

**AI call logged** with `purpose = 'interview_reveal'`.

**Dependencies:** `m2-q4-interviews`

---

#### Q4 Action

**Key:** `m2-q4-action`
**Role:** action
**Title:** Which one will you commit to?
**Component:** `choose_opportunity` (working name)

**Intent:** Pick one opportunity to carry into M3. Deliberate, not rushed.

**Pacing:**
- `mode: 'confirm'`
- `min_days: 2`
- `guidance: "Whatever you choose, you'll spend real time with. Don't rush this. Take a couple of days if you need them."`

**Description:**

> You've observed, investigated, researched, and interviewed. Now choose.
>
> Whatever you pick, you'll spend real time with it. You'll test it with real people. It won't be perfect, and you don't need it to be. You just need to be willing to work on it for the next stretch.

**Prompt:** *"Which one will you commit to?"*

**Behavior:**

1. **Reflection step** — before selection, three questions to answer in a short freeform:
   - *"Which opportunity do you think about when you're not working?"*
   - *"If two of them failed tomorrow, which one would you still want to try?"*
   - *"Which one can you not stop thinking about?"*
   These are saved with the mission progress, not to the opportunity itself.

2. **Gather-more option** — a button: *"I need more information."*
   - Returns to Q4 Investigation or Q3 if the user wants.
   - No forced loop.
   - When they're ready, they return to this node.

3. **Selection** — pick one from the shortlist.

4. **Confirmation screen:**
   - *"You're committing to [opportunity name]."*
   - Show the journey: which observations it came from, which obstacles it survived, which interviews it withstood.
   - Prompt: *"You're not building this. You're testing it. In M3, you'll put a concrete offer in front of real people and see what they do."*

5. **Save:**
   - Selected opportunity → `status = 'testing'`
   - Others → `status = 'parked'`
   - Create `user_projects` row:
     - `user_id`
     - `opportunity_id` — the selected opportunity
     - `title` — opportunity title
     - `description` — opportunity description
     - `metadata.source_mission = 'mission-2'`, `metadata.interview_count`, `metadata.reasoning` (from reflection)

6. **Mission handoff** — set `user_program_state.current_node_key` to `m3-setup`.

**Writes:**
- `user_opportunities.status`
- `user_projects` row
- `user_program_state.current_node_key`

**Dependencies:** `m2-q4-reveal`

**⚠ OPEN:**
- What if the user wants to drop all three and start over? My read: offer a "start over" path that returns to Q1 with parked opportunities preserved. Not common, but shouldn't be blocked.

---

### Mission Reveal

**Key:** `m2-reveal`
**Role:** reveal
**Title:** How you got here.
**Component:** `mission_transformation_synthesis`

**Intent:** Show the elimination story — how the user reached their chosen opportunity.

**What the reveal shows:**

1. **The funnel:**
   - X observations captured
   - Y qualified as real + cared about
   - Z promoted to opportunities
   - W survived feasibility
   - V shortlisted
   - U validated with real people
   - 1 committed to

2. **Per chosen opportunity, the evidence chain:**
   - Original observation(s)
   - Feasibility assessment
   - Viability research
   - Interview quotes
   - Reflection answers

3. **What was parked, and why** — the user can see the alternatives they set aside, with the reasoning.

4. **Transformation confirmation:**
   - From: "Looking for a business idea."
   - To: "I have observed problems, investigated them, talked to real people, and chosen one to test with evidence."

**Dependencies:** `m2-q4-action`

---

### Mission Action

**Key:** `m2-action`
**Role:** action
**Title:** Move to the pressure test.
**Component:** `mission_transfer_action`

**Intent:** Hand off to Mission 3.

**Description:**

> You're not building the business. You're testing it. In M3, you'll take this problem, turn it into a concrete offer, and put it in front of real people.
>
> Bring one question with you: *will they actually act?*

**Behavior:** Confirm the project, then advance to `m3-setup`.

**Dependencies:** `m2-reveal`

---

## Summary: Node Count

| Quest | Nodes | Writes |
|---|---|---|
| Mission setup | 1 | `user_opportunities` (if user has idea) |
| Q1 — Notice Problems | 5 | `user_observations`, `user_opportunities`, `observation_links` |
| Q2 — Can I Do Anything? | 6 | `user_observations`, `observation_links`, `user_opportunities.metadata` |
| Q3 — Is This Worth Solving? | 7 | `user_observations`, `observation_links` |
| Q4 — Validate | 4 | `user_observations`, `observation_links`, `user_opportunities.status`, `user_projects` |
| Mission reveal | 1 | none |
| Mission action | 1 | `user_program_state` |
| **Total** | **25** | |

---

## Feedback 1 on Consolidated Open Questions

1. Pre-existing idea — does it go through Q2/Q3 filtering, or is it exempt? (My read: filtered.)
    - response: Everything is filtered. Even users existing idea are entered as observation, we might add a flag in metadata if it is existing idea

2. Observations writeable outside Q1 Inv 1? (My read: yes.)
    - response:  yeah we have observation also manage through observations page and in future we wil also have an app for users to add observations and journals on the go

3. Re-qualify after Q1 Reveal? (My read: yes, via button in reveal.)
    - response:  yes we should allow this.

4. Q1 Action — does the pre-existing opportunity need an observation link? (My read: no.)
    - response:  yes they enter preexisting idea and an observation

5. Q2 Inv 1 — three observations per opportunity, or one with three sections? (My read: three observations.)
    - response:  i doont understand this at all. what do you mean by 3 observation per opportunity?

6. Q2 Inv 3 — what if the user can't think of any smallest version? (My read: allow skip, flag as gap in reveal.)
    - response:  agree. they will again look at it in pressure test

7. Q2 Action — can users un-park? (My read: yes, explicitly.)
    - response:   yes

8. Q3 Inv 3 — competitors as metadata array, or own table? (My read: metadata.)
    - response:  metadata,  which we will copy over to projects table

9. Q3 Action — what if fewer than 3 opportunities are active? (My read: proceed with fewer.)
    - response:  show a warning/hint and proceed

10. Q4 Inv — is customer_interview a valid focus value? (Schema change needed.)
    - response:  yes we can change the schema

11. Q4 Inv — is conversation the right type? (Confirm against other parts of the app.)
    - response:  we can look at the schema 

12. Q4 Inv — require at least 1 interview per opportunity, or allow skip? (My read: require.)
    - require

13. Q4 Action — is there a "start over" path? (My read: yes, returns to Q1 with parked preserved.)
    - response:  yes but i will have to think about the implementation in progress

14. Patterns in Q1 Reveal — persisted or generated fresh? (My read: fresh, logged in ai_logs.)
    - response:  we will presist it from ai_logs but give user option to regenerate

15. Pacing schema — new top-level key on ProgramNode? Gate strength levels (block/confirm/remind/show)? (My read: yes, four levels.)
    - response:  we need to keep this quite simple, delay_days and isStrict

## Feedback 2
Good — mostly locked. Three things need clarifying before we move to Pass 2. Two are my errors, one is a real design question.

## Clarifications

### #1 — Pre-existing idea is entered as observation AND opportunity

You said: *"Everything is filtered. Even users existing idea are entered as observation, we might add a flag in metadata if it is existing idea."*

And in #4: *"yes they enter preexisting idea and an observation."*

So the pre-existing idea is captured twice:
- As an **observation** (`metadata.is_existing_idea = true`)
- As an **opportunity** (linked back to that observation via `observation_links`)

That's cleaner than my read. It means:
- The pre-existing idea goes through the *same* qualification pipeline as everything else in Q1
- If it fails Q1 qualification, it's visible in the reveal as something the user's own flags rejected
- If it passes, it's promoted like any other observation
- The mission setup writes both records, not just the opportunity

**Updated behavior for Mission Setup:**
1. Save the idea as a `user_observations` row:
   - `type = 'observation'`
   - `domain = 'problem'`
   - `focus = 'personal'` (or `zone_of_influence` depending on who has the problem)
   - `metadata.is_existing_idea = true`
2. Save the idea as a `user_opportunities` row (`status = 'added'`)
3. Create `observation_links` row: `entity_type = 'opportunity'`, `relationship = 'source'`

This changes my earlier note about "no observation needed." Your answer overrides — and it's the right call because it keeps every opportunity traceable to an observation.

### #5 — Q2 Inv 1 "three observations per opportunity"

This was my error in wording. Let me restate what I was actually asking.

Q2 Investigation 1 asks the user three questions per opportunity:
1. What do I already know about this domain?
2. What would I need to learn, and how long?
3. Who would I need access to?

The question was: do these three answers each become their own `user_observations` row (three rows per opportunity), or do they all live in one observation row with three sections in `metadata`?

**Three rows** means each answer is independently queryable, and the reveal can compare "domain knowledge" across opportunities without parsing JSON.

**One row** means fewer records but a nested metadata shape that the reveal has to unpack.

My earlier recommendation was three rows. But since you've already said Q3 research goes into observations, and we're stacking a lot of research observations, it's worth reconsidering for consistency.

**Two ways to structure it:**

**Option A — One observation per section (my earlier read):**
- `metadata.section = 'domain' | 'learning' | 'access'`
- Three rows per opportunity × three opportunities = 9 rows just for Q2 Inv 1
- Plus 2 rows per opportunity for Inv 2 = 6 rows
- Plus 1 per opportunity for Inv 3 = 3 rows
- Q2 total: 18 observations

**Option B — One observation per opportunity per investigation:**
- `metadata.answers = { domain, learning, access }`
- Three rows per opportunity per investigation node = ~9 rows total for Q2
- Metadata is nested but scoped to one node's output

**Option C — One observation per opportunity per question, regardless of investigation:**
- Flattens everything to a single-row-per-question pattern
- Q2 total still ~18 rows, but uniform shape

My read: **Option B.** One observation per opportunity per investigation node. The investigation is the unit of work; its output is one observation. Metadata holds the three answers as a structured object. This keeps Q2 from ballooning and matches how users think about the work (*"I researched this opportunity"* vs *"I answered question 1, then question 2..."*).

**But** — if you want Q3 to be queryable per criterion (which was the earlier reasoning), Option A might be right for Q3 and Option B for Q2.

Worth deciding whether observations are **one per investigation** or **one per question**. That's a foundational choice that affects every research node.

### #14 — Persist patterns in `ai_logs`, allow regenerate

You said: *"we will persist it from ai_logs but give user option to regenerate."*

So the flow is:
1. On first entry to Q1 Reveal, generate patterns → save to `ai_logs` with `purpose = 'observation_patterns'`
2. Display the saved output
3. "Regenerate" button → new AI call → new `ai_logs` row
4. Display the latest

**Two questions:**
- Do we display the latest only, or keep a history?
- Does regeneration overwrite the display or add to it?

My read: **latest only, history retained in `ai_logs`.** Regeneration replaces the display. If the user wants to compare, that's a future feature.

### #15 — Pacing: `delay_days` and `isStrict`

You said: *"we need to keep this quite simple, delay_days and isStrict."*

That collapses my four-level proposal into two:
- `delay_days: number` — minimum days before the node can be completed
- `isStrict: boolean` — if true, hard block; if false, soft confirm

So:
- Q1 Inv 1: `delay_days: 5, isStrict: false` — soft confirm at day 5
- Q4 Action: `delay_days: 2, isStrict: true` — hard block for 2 days

Cleaner than my proposal. I'll use this shape.

One follow-up: does `isStrict` mean "block until delay passes" or "block until delay passes AND still show a confirm dialog"? My read: strict = hard block, no dialog, button disabled with message. Non-strict = dialog with "Are you sure?" on attempt.

---

## What I need before Pass 2

**Two open questions, one foundational:**

**A. Observation granularity for research nodes.**
One observation per **investigation node**, or one per **question**?
- Per-investigation: cleaner, fewer rows, nested metadata.
- Per-question: queryable, uniform, more rows.

My read: per-investigation for Q2, per-question for Q3. But you should decide the principle, not per-quest.

**B. Pacing `isStrict` semantics.**
Does strict mean hard block only, or hard block plus confirmation dialog? My read: hard block only.

Once those are settled, I'll write Pass 2: the proposed data shape for every node — exactly what gets written where, in what shape. Then Pass 3 evaluates the schema against it.

## Clarification on Feedback 2
A. per-investigation for Q2, per-question for Q3
B. isStrict flag determines enforcement - if we have the flag then we will not let progress before the delay days condition is met. If there is no flag then we just suggest to users days they should spend on the node. 


## Nanostore Context for the Mission

1. User_program_context row

```ts
[{"id":"987f6b65-af93-46b0-ac12-ac9649fda7c9","user_id":"16a901d0-5208-4e4d-8da4-2feda996e0bb","program_currency":null,"capabilities":"{\"items\": [{\"id\": \"fix_things\", \"title\": \"Fix things when they break\", \"evidence\": \"I develop apps and i frequently have to fix things\"}, {\"id\": \"build_things\", \"title\": \"Build things\", \"evidence\": \"love developing apps and software\"}]}","experience":"{\"items\": [{\"id\": \"industry\", \"title\": \"Worked in an industry\", \"evidence\": \"have been part of architecture, urban development, culture and software community\"}, {\"id\": \"built_from_scratch\", \"title\": \"Built something from scratch\", \"evidence\": \"I have developed several app and a startup\"}, {\"id\": \"run_project\", \"title\": \"Run an event or project\", \"evidence\": \"Used to be president of my student union in college days\"}, {\"id\": \"managed_resources\", \"title\": \"Managed money or limited resources\", \"evidence\": \"Startup days\"}]}","resources":"{\"items\": [{\"id\": \"time\", \"type\": \"time\", \"title\": \"Time\", \"detail\": \"i can work\"}]}","motivations":"{\"motivations\": [{\"id\": \"frustration\", \"title\": \"I cannot let go of a problem that bothers me.\", \"reflection\": \"I constantly keep thinking about the problems and how to solve it\"}, {\"id\": \"impact\", \"title\": \"I want to make a difference for someone.\", \"reflection\": \"I want to help people around me\"}]}","desired_future":"{\"reflection\": \"I would have more control of my life and goals. i would be able to do more\"}","constraints":"{}","fears":"{}","perceived_barriers":"{\"barriers\": [{\"id\": \"money\", \"title\": \"I think I need more money.\", \"reflection\": \"Everytime i think of an idea an do rough math, i take a step back seeing how much money it would need\"}, {\"id\": \"clarity\", \"title\": \"I don't know where to start.\", \"reflection\": \"After planning phase when i have to actually start doing thing\"}, {\"id\": \"failure\", \"title\": \"I'm afraid it won't work.\", \"reflection\": \"being demoralied and giving up altogher\"}]}","quit_conditions":"{\"conditions\": [{\"id\": \"slow_progress\", \"title\": \"Nothing seems to be happening.\", \"reflection\": \"I need to see some result to keep going if nothing happens i get demotivated\"}]}","network_context":"[{\"id\": \"cd29450f-0e76-4eaa-b488-24e21c13a06a\", \"name\": \"Essec Alumni Group\", \"type\": \"group\", \"access\": \"whatsapp\", \"possibleUses\": [\"tell_people\"]}, {\"id\": \"5a929fcb-9552-466e-94f5-4539fd7f7ea4\", \"name\": \"in my phonebook\", \"type\": \"people\", \"access\": \"phone\", \"possibleUses\": [\"get_feedback\"]}, {\"id\": \"2c68a3e4-fb20-4d1f-bfcd-8d18072777ed\", \"name\": \"my professional connections\", \"type\": \"professional\", \"access\": \"linkedin\", \"possibleUses\": [\"find_someone\", \"get_introduced\"]}]","created_at":"2026-10-05 11:48:39.191165+00","updated_at":"2026-10-07 18:49:00.139+00","start_drive":"I have always thought of starting a business an dont get far. it does  not go beyond the idea, stage so out of frustation i have decided to try urge","additional_assessment":null}]

```
2. user_ profile row

```ts
[{"id":"3bb55a4b-f2d3-4939-bf2c-e67135de6172","user_id":"47bec6c0-fc19-4087-a035-d57b1928eb6b","username":"nicotex","username_key":"nicotex","display_name":"nicotex","bio":null,"avatar_url":"https://vgfyggjvtpkfommbmxrd.supabase.co/storage/v1/object/public/avatars/47bec6c0-fc19-4087-a035-d57b1928eb6b-0.0668930615404717.jpeg","city":"bangalore","country":"India","website_url":null,"social_links":"{}","mobile_number":null,"shipping_address":null,"created_at":"2026-10-09 12:12:09.626936+00","updated_at":"2026-10-09 12:12:09.626936+00","currency":"INR","age_group":null,"gender":null}]

```

## Schema
these table can be modified quite a bit  to suit our approach and nodes. 
```sql
create table public.user_observations (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  content text not null,
  type text not null default 'observation'::text,
  domain text null,
  focus text null,
  observed_at timestamp with time zone null,
  source_node_key text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  context text null,
  constraint user_observations_pkey primary key (id),
  constraint user_observations_source_node_key_fkey foreign KEY (source_node_key) references program_nodes (node_key) on delete set null,
  constraint user_observations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.user_opportunities (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  description text null,
  problem text null,
  customer text null,
  hypothesis text null,
  status public.opportunity_status not null default 'added'::opportunity_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_opportunities_pkey primary key (id),
  constraint user_opportunities_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_projects (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  opportunity_id uuid null,
  title text not null,
  description text null,
  selected_offer_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_projects_pkey primary key (id),
  constraint user_projects_opportunity_id_fkey foreign KEY (opportunity_id) references user_opportunities (id) on delete set null,
  constraint user_projects_selected_offer_fk foreign KEY (selected_offer_id) references user_project_offers (id) on delete set null,
  constraint user_projects_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.observation_links (
  id uuid not null default gen_random_uuid (),
  observation_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  relationship text null,
  created_at timestamp with time zone not null default now(),
  constraint observation_links_pkey primary key (id),
  constraint observation_links_unique unique (
    observation_id,
    entity_type,
    entity_id,
    relationship
  ),
  constraint observation_links_observation_id_fkey foreign KEY (observation_id) references user_observations (id) on delete CASCADE
) TABLESPACE pg_default;



```

**Note of observation**
Observation is first class features throughout the app and user save observations for everything in one table. We used the following options for the table data. So in case of this mission we will use 
- type = observation
- domain = problem
- focus = one based on source 


```ts
export const OBSERVATION_TYPES = [
    'observation',
    'personal',
    'conversation',
    'research',
    'behavior',
    'experiment',
    'event',
] as const;

export type ObservationType =
    (typeof OBSERVATION_TYPES)[number];

export const OBSERVATION_DOMAINS = [
    'problem',
    'customer',
    'product',
    'marketing',
    'sales',
    'finance',
    'operations',
    'competition',
    'market',
    'personal',
    'other',
] as const;

export type ObservationDomain =
    (typeof OBSERVATION_DOMAINS)[number];

export const OBSERVATION_FOCUS_OPTIONS = {
    problem: [
        'personal',
        'people',
        'zone_of_influence',
        'changes',
        'markets',
    ],
    experiment: [
    'asking',
  ],
} as const;

```