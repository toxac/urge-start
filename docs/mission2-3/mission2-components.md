# Mission 2 component guide (With Feedback)

Read `components-shared.md` first (contract, pacing, AI rules, shared patterns, vocabulary).

**Status model** (`user_opportunities.status`): `added` when chosen in Q1, `parked` when set aside (Q2 action, Q3 action), `testing` when chosen in Q3 action. `shortlisted` is unused in M2.

**Mapping from the previous draft**: payer, market, competition, synthesis and the viability matrix are gone (deferred to M4). Feasibility is one guided conversation. Interviews now come before feasibility.

---

## `m2-setup` · `opportunity_starting_point`

**Purpose.** Let the user bring an existing idea, or move on without one.

**Reads.** `programContext.start_drive`.

**Flow.**

1. Show what the user said in M1 in their own words ("You told us: …").
2. Ask: "Is there an idea you've been carrying?" with two options: a text area, and "Not really".
3. If AI detects a specific idea in `start_drive`, prefill the text area and say "This sounds like it might be one. Is it?" Never assume. Keep it editable.
4. On "Not really": show one line ("That's fine. You'll find one by noticing.") and enable Continue. Nothing is written.
5. If they wrote an idea: DraftAndCorrect proposes `title` (short), `problem` and `customer` from their words. All optional, all editable.

**Writes (only if an idea exists).**

- `user_observations`: `type 'observation'`, `domain 'problem'`, `focus 'personal'` (or `'zone_of_influence'` if the user says it is someone else's problem), `title`, `content` (the user's own words), `source_node_key 'm2-setup'`, `metadata { is_existing_idea: true }`.
- `user_opportunities`: `status 'added'`, `title`, `description`, `problem`, `customer`, `metadata { source_observation_id, is_existing_idea: true }`.
- `observation_links`: `entity_type 'opportunity'`, `relationship 'source'`.

**AI.** `purpose 'idea_extraction'` (draft only).

**Completion.** Always enabled.

**Edge cases.** If the user edits the idea on re-entry, update both rows. If they delete the idea, set the opportunity to `parked` and keep the observation.

**Feedback**

This is very close to how i would frame it except i would not let users add ideas as opportunities but only as an observation. Main reason for me having user add their idea at the start of the mission is to acknowledge their existing ideas and psychologically making the feel they are not foregoing anything from before.

---

## `m2-q1-setup` · `noticing_setup`

**Purpose.** Set the shift from brainstorming to noticing.

**UI.** The description, one prompt ("What's been bugging you lately?") with an optional text box that, if used, creates a first observation (`focus 'personal'`, `source_node_key 'm2-q1-setup'`). Skippable.

**Writes.** Optional single observation. Otherwise none.

**Completion.** Always enabled.

---

## `m2-q1-observe` · `problem_capture`

**Purpose.** An ongoing, light way to capture problems, including two real asks.

**Reads.** All the user's `user_observations` where `type 'observation'` and `domain 'problem'` (not just this node's), plus `programContext` for AI hints.

**Layout.**

1. **Prompt strip** (top): rotating cards, one visible, swipe for next. Tapping one opens the capture sheet pre-filled with `focus`.
   
   | Prompt                                                        | focus               | Kind    |
   | ------------------------------------------------------------- | ------------------- | ------- |
   | What frustrated you today?                                    | `personal`          | note    |
   | What did someone around you complain about?                   | `people`            | note    |
   | What did you see someone struggle with?                       | `zone_of_influence` | note    |
   | What's changing that might create new problems?               | `changes`           | note    |
   | What problems are showing up in a place you're curious about? | `markets`           | note    |
   | **Ask someone: what's annoyed you this week?**                | `people`            | **ask** |
   | **Ask someone: what do you wish was easier?**                 | `zone_of_influence` | **ask** |
   
   The two **ask** cards use WorldTask. "Go": suggested wording and who to ask (ContactPicker, optional). "Back": log what they said.

2. **Capture sheet.** Two fields only: one-line title, then "What did you see, hear or live through?" (free text). Save. Everything else is optional and appears after save as a gentle prompt, one at a time, only when missing: "Who has this problem?" then "What do they do about it now?" Answers go to `metadata.who`, `metadata.workaround`. Extra optional fields live behind "Add detail" (`cost`, `frequency`, `why_unsolved`, `can_reach`).

3. **Note list** (below): newest first. Each row: title, focus chip, date, and a three-state "Matters to me" tap (yes / maybe / no) stored as `metadata.care`. No Complete/Incomplete badges. Tap a row to edit.

4. **"What should I look for?"** (optional button). Reads the user's notes and context and returns three prompts as plain suggestions ("You've written about teachers a few times. Have you seen how they handle X?"). `purpose 'observation_hints'`. Never auto-creates notes.

**Writes.** `user_observations` rows: `type 'observation'`, `domain 'problem'`, `focus`, `source_node_key 'm2-q1-observe'` (null when added from the Observations page), `observed_at`. `metadata { who?, workaround?, cost?, frequency?, care?, care_at?, via: 'noticed' | 'asked', asked_contact_id? }`. Ask cards also create a `user_tasks` row (`task_type 'ask'`, `is_nudge_enabled true`, `source_node_key`), completed when the note is saved.

**Completion.** At least 3 notes to enable Continue, with a soft message beyond that: "Around ten gives you something to see patterns in. You can keep adding after you move on." Below 3, Continue is disabled with "Add a couple more first."

**Pacing.** `delay_days: 5`, no `isStrict`. Show the guidance line only.

**Edge cases.** Notes added elsewhere in the program also appear here. Deleting a note linked to an opportunity is blocked with an explanation. A note that is the existing idea (`is_existing_idea`) is shown with a small "Your idea" chip.

---

## `m2-q1-reveal` · `problem_patterns_reveal`

**Purpose.** Mirror what keeps repeating.

**Reads.** All problem notes (with `care`, `who`, `workaround`), `programContext` (capabilities, experience, motivations, network), `user_profile`.

**UI.** 3 to 5 RevealBlocks:

- Patterns and clusters ("Four of your notes are about bookkeeping").
- Overlaps between lenses ("You noticed this one from two angles").
- Connections to the user's own context ("This is close to what you said you've built before").
- Notes marked `maybe`/`no` for care that connect to others ("You marked this 'no', but it shows up in three places. Worth a second look?"), with an inline control to change the tap.

Footer: **Regenerate**, and "Add more notes" (back to capture without losing the reveal).

**AI.** `purpose 'observation_patterns'`, persisted, regenerate (shared rules). Max 5 blocks. Each block cites note ids.

**Writes.** Only the `ai_logs` row. Changing a care tap writes to the observation.

**Completion.** Always enabled.

---

## `m2-q1-action` · `problem_selection`

**Purpose.** Choose up to three notes to look at more closely.

**Reads.** All problem notes, with the existing-idea opportunity if any (`observation_links` relationship `'source'`).

**UI.** A list, sorted with `care: yes` first. Tap to select. HardCap of 3: at three, others are disabled with "Three is plenty. Unselect one to swap." Show a line under the list: "The rest stay in your notes."

**Writes (on Continue).**

- For each selected note without an opportunity: `createOpportunity` (`status 'added'`): `title`, `description` (note content), `problem` (title), `customer` (`metadata.who`), `metadata { source_observation_id }`. Link with `relationship 'source'`.
- If the selected note is the existing idea, reuse its existing opportunity.
- If the existing idea was **not** selected, set its opportunity to `parked` with `reason 'not chosen in Q1'`.

**Completion.** 1 to 3 selected. With fewer than 3 notes available, show "You've only noticed {n}. You can go on, or add more first."

**Payload.** `{ opportunity_ids }`.

---

## `m2-q2-setup` · `conversation_setup`

**Purpose.** Frame talking to people as listening, not selling.

**UI.** Description, plus the chosen problems listed with a single prompt: "Who could you talk to about these?" Selecting contacts here is optional and creates nothing yet (they are re-used in the next node).

**Writes.** None.

---

## `m2-q2-conversations` · `customer_conversations`

**Purpose.** Plan, hold and log conversations. This is the core real-world step of M2.

**Reads.** Chosen opportunities (status `added`), `user_contacts`, `programContext.network_context`, prior conversations.

**Layout.** OneAtATime over problems. Each shows: the problem in the user's words, number of conversations logged, the target (at least 1, suggest 2 to 3).

**WorldTask flow per conversation.**

1. **Plan** ("Who will you talk to?"). ContactPicker. A name is strongly encouraged (it lets M3 ask them again). If the user refuses to give one, allow a descriptor only.
2. **Predict.** One line: "What do you expect they'll say?" Saved to the task.
3. **Go.** Show a short script with the six things to find out, not a form: the last time it happened, how often, what they do now, what it costs them, what they've tried, who else has it. Offer an AI-drafted opening message (DraftAndCorrect), which the user copies and sends. Note that nothing is sent by Urge.
4. **Back** ("What happened?"). One big free-text box for their notes or recollection. Then:
   - AI drafts answers to the six questions from the notes (DraftAndCorrect). Missing ones show as "Not covered", never invented.
   - "The one thing they said that stuck with you" (key quote).
   - "Anything that surprised you?"
   - "Would they pay?" is optional, labelled "Weak signal. Don't lean on it."

**Writes.**

- `user_tasks` (plan/predict): `task_type 'conversation'`, `contact_id`, `source_node_key`, `metadata { opportunity_id, prediction }`, status updated on return.
- `user_contacts` (if a name is given and no match): `name`, `roles ['conversation']`, `context`.
- `user_observations` (on return): `type 'conversation'`, `domain 'customer'`, `focus 'customer_interview'`, `title` ("Talked to Priya, runs a bakery"), `content` (the user's notes), `source_node_key`, `metadata.interview = { opportunity_id, contact_id?, interviewee { name?, context }, prediction, answers { last_time, frequency, current_solution, cost, tried_before, others_with_problem }, would_pay?, key_quote?, surprises? }`.
- `observation_links`: `entity_type 'opportunity'`, `relationship 'interview'`; also `'contact'` if a contact exists.

**AI.** `purpose 'conversation_answers'` (extraction draft only).

**Completion.** Every chosen problem has at least one logged conversation. Otherwise disabled: "Talk to someone about {problem} first." There is no skip, because the node exists to get the user out of the app. If someone is unreachable, "Remind me" creates a nudge task.

**Pacing.** `delay_days: 3`, not strict.

**Edge cases.** Group conversations: allow more than one name in `interviewee`. A user who talks to the same person about two problems logs two conversations.

---

## `m2-q2-reveal` · `conversations_reveal`

**Purpose.** Show what people said against what the user expected.

**Reads.** Conversation observations grouped by opportunity, predictions, the original notes.

**UI.** Per problem, 3 RevealBlocks:

- What people said, in their own words (quotes, EvidenceChips).
- What repeated across conversations, or what only one person said.
- Prediction against reality ("You expected X. Most people said Y.").
- What nobody mentioned that the user's note implied.

**AI.** `purpose 'conversations_reveal'`, persisted. Do not infer which problem the user is "most excited" about. If useful, end with a question instead: "Which of these did you write the most about?"

**Writes.** None except `ai_logs`.

**Completion.** Always enabled.

---

## `m2-q2-action` · `conversations_decision`

**Purpose.** After hearing people, decide what to do with each problem.

**UI.** OneAtATime. Per problem, three options: **Keep going**, **Talk to more people**, **Set this one aside**. Optional one-line note ("What made you decide?").

**Writes (on Continue).**

- Keep: no change.
- More people: create a `user_tasks` row (`task_type 'conversation'`, nudge on) and keep.
- Set aside: `setOpportunityStatus(id, 'parked', { reason, atNodeKey 'm2-q2-action' })`.

**Completion.** At least one problem is "Keep going". If the user sets every problem aside, show "You've set everything aside. Want to go back to your notes and look again?" and route to `m2-q1-observe` via `nextNodeKey`.

**Payload.** `{ kept: [ids], parked: [ids] }`.

---

## `m2-q3-setup` · `path_setup`

**Purpose.** Shift from "is it real" to "could I do something about it".

**UI.** Description and the remaining problems (status `added`), one line each. No writes.

---

## `m2-q3-assessment` · `path_assessment`

**Purpose.** One light, guided look at what each remaining problem would take.

**Reads.** `programContext` (capabilities, experience, resources, `network_context`, constraints), the problem's conversations (for "what people do now"), `user_profile` for currency.

**Layout.** OneAtATime. For each problem, a GuidedConversation of six questions, one at a time. Previous answers collapse.

| #   | Question                                                                | Aids shown                                                                                                                                           |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | What do you already know about this?                                    | The user's capabilities and experience as soft chips, not forms                                                                                      |
| 2   | What would you have to learn, and how long might that take?             | Time resource from context                                                                                                                           |
| 3   | Who would you need help from? Who do you know?                          | `network_context` groups and contacts                                                                                                                |
| 4   | Who already does something about this? What did people say they do now? | Prefilled from conversation answers `current_solution`, `tried_before`. User adds names. Optional follow-up: "What's harder about it than it looks?" |
| 5   | What's the smallest version you could do for one person in two weeks?   | "Suggest a few" button (AI, optional). **Skippable.**                                                                                                |
| 6   | What would you need to hear to stop?                                    | Optional                                                                                                                                             |

At the end: DraftAndCorrect shows a short summary in the user's own words ("What you'd need to know… Who you'd need… What people do now… Smallest version…"). The user edits and saves.

**Writes.** One `user_observations` row per problem (upsert): `type 'research'`, `domain 'problem'`, `focus 'feasibility'`, `title` ("What it would take: {problem}"), `content` (the corrected summary), `source_node_key`, `metadata.feasibility = { opportunity_id, knows, needs_to_learn, learn_time, access [{ need, contact_id?, have }], current_alternatives [{ name?, what_they_do }], harder_than_it_looks?, smallest_version?, smallest_version_skipped?, stop_signals? }`. Link: `entity_type 'opportunity'`, `relationship 'feasibility'`.

**AI.** `purpose 'path_followup'` (one follow-up at most), `'smallest_version_suggestions'` (optional), `'path_summary'` (draft).

**Completion.** Every remaining problem has a saved summary. Step 5 may be skipped; the reveal flags it.

**Pacing.** `delay_days: 1`, not strict.

**Edge cases.** The user cannot skip a whole problem here; if they want to drop one, point them back to the previous action. If conversation data is missing for a field, the aid is simply hidden.

---

## `m2-q3-reveal` · `path_reveal`

**Purpose.** Put the remaining problems side by side in the user's own words.

**Reads.** Feasibility observations, conversation observations, context (time, resources, network).

**UI.** One column per problem on wide screens, swipeable cards on mobile. Rows (the user's text, not scores): what you'd need to learn and how long, who you'd need, what people do now, smallest version, what would make you stop. Below, RevealBlocks:

- Mismatches ("You said this would take about six months to learn. You also said you can only spare weekends.").
- Gaps ("You skipped the smallest version for this one.").
- Connections to context ("You have two contacts in the group you said you'd need.").
- If the problem was the user's pre-existing idea, a gentle note referencing specific things they wrote, not a judgement.
- End with one open question: "Which of these did you write the most about?"

No ranking. No highlight colour for a winner.

**AI.** `purpose 'feasibility_assessment'`, persisted, regenerate.

**Writes.** None except `ai_logs`.

---

## `m2-q3-action` · `problem_commitment`

**Purpose.** Choose one problem to work on, or decide not to yet.

**Pacing.** `delay_days: 2, isStrict: true`. Continue stays disabled until 2 days after the reveal was completed. The user can still read and write the reflection.

**Reads.** All opportunities and their evidence chain; parked opportunities in a collapsed "Set aside" section.

**Flow.**

1. **Reflection** (free text, three prompts, saved as one record):
   - "Which one do you think about when you're not working?"
   - "If two of them failed tomorrow, which would you still want to try?"
   - "Which one can't you stop thinking about?"
2. **Choose.** Select one from the remaining problems. Alongside, three explicit alternatives: **None of these**, **Not right now**, **Start over**. Each takes one sentence of "why".
3. **Un-park.** A visible "Bring one back" in the Set aside section lets the user pull a parked problem back into the choice (status back to `added`). Explicit only.
4. **Confirm.** Show the evidence chain for the chosen one: where it came from, who they talked to, what people said, what they said it would take. Then: "You're not building this. You're going to test it with real people."

**Writes (on confirm).**

- Chosen: `status 'testing'`. Others still `added`: `parked`.
- `user_projects`: `opportunity_id`, `title`, `description`, `metadata { source_mission: 'mission-2', conversation_count, reasoning, evidence { note_ids, conversation_ids, feasibility_id }, current_alternatives (copied from feasibility), smallest_version, stop_signals }`.
- Reflection answers into `metadata.reasoning`.
- None of these: all `parked`, no project; route to `m2-q1-observe`.
- Not right now: nothing changes; create a `follow_up` task with a nudge; user returns later.
- Start over: route to `m2-q1-observe` with `nextNodeKey`; statuses are kept as they are. (Rework rules in `components-shared.md`, section 9.)

**Completion.** A confirmed choice, or an explicit alternative. "Not now" does not complete the node.

**Payload.** `{ project_id, opportunity_id }`.

---

## `m2-reveal` · `mission_transformation_synthesis`

**Purpose.** Show how the user got here.

**Reads.** Everything: notes, chosen/parked opportunities with `status_history`, conversations, feasibility, project.

**UI.**

1. A simple story, not a funnel chart: "You noticed {n} problems. You chose {k} to look at. You talked to {c} people. You set {p} aside because {reasons in their words}. You chose {chosen}."
2. Evidence chain for the chosen problem (EvidenceChips): original note, conversation quotes, the "what it would take" summary, the reflection.
3. Set aside: each with their reason, and a small "Bring back" link.
4. Transformation: "You came in looking for a business idea. You're leaving with a problem you've talked to people about." Then ask: "How would you say it in your own words?" (optional, saved to `project.metadata.m2_in_my_words`).

**AI.** `purpose 'm2_synthesis'`, persisted. Mirror only.

**Writes.** Optional `project.metadata`.

---

## `m2-action` · `mission_transfer_action`

**Purpose.** Hand off to Mission 3.

**UI.** One line about what is next, and one question: "What do you most want to find out next?" Saved to `project.metadata.m3_question`. Confirm button: "Start testing it".

**Writes.** `project.metadata.m3_question`; advance to `m3-setup` via `onComplete`.

**Completion.** The question is optional; the confirm is not.
