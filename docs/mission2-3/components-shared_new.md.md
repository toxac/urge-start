# Node component guide: shared contract

Applies to every node component in Missions 2 and 3 (and should apply to later missions). Mission-specific guides: `mission2-components.md`, `mission3-components.md`.

Every node in `program_nodes` renders exactly one component, selected by `node.component`. A component owns its UI, its reads, its writes and its AI calls. The program shell owns progress, routing and pacing.

---

## 1. Component contract

```ts
type NodeComponentProps = {
  node: ProgramNode;               // row from program_nodes (incl. pacing, metadata)
  programVersion: number;
  userId: string;
  profile: UserProfile;            // city, country, currency, display_name
  programContext: UserProgramContext;
  projectId?: string;              // present from M3 onwards
  unlockedAt: string;              // when this node became available (see Pacing)
  isReentry: boolean;              // node was completed before and user came back
  onComplete: (payload?: Json, nextNodeKey?: string) => Promise<void>;
};
```

Rules:

1. **Components load their own state.** On mount, query existing rows for this node (by `source_node_key`, and `metadata.opportunity_id` where relevant) and render the saved state. Closing the app mid-node must lose nothing.
2. **Write as you go.** Save each answer when the user finishes it, not on Continue. Continue only calls `onComplete`.
3. **Writes are upserts**, keyed by `(user_id, source_node_key, metadata.opportunity_id [, metadata.contact_id])`, so re-entry edits rather than duplicates.
4. **`onComplete(payload)`** calls `complete_program_node(p_node_key, p_program_version, p_payload, p_next_node_key)`. The payload holds *references and counts*, never copies of content: `{ opportunity_ids: [...], observation_ids: [...] }`. `nextNodeKey` is only for routing overrides (start over, rework).
5. **Setup and reveal components write nothing** unless this guide says so. Reveals persist their AI output in `ai_logs`, nowhere else.
6. **Only action nodes change statuses** (`user_opportunities.status`, `user_program_state`, projects).

## 2. Pacing

`node.pacing = { delay_days: number; isStrict?: boolean }`

- `unlockedAt` = `completed_at` of the most recently completed dependency in `user_progress`. For the first node of a mission, the completion time of the previous mission's last node.
- `usePacingGate(node, unlockedAt)` returns `{ unlocksAt, isLocked, suggestion }`.
- **`isStrict: true`**: Continue is disabled until `now >= unlockedAt + delay_days`. Show: "You can continue on {date}. Use the time." No dialog. The rest of the node stays usable.
- **No `isStrict`**: show a quiet line using `node.metadata.guidance` ("Most people take about a week."). No dialog, no blocking.

## 3. Writing helpers

Use these. Do not write rows inline in components.

```ts
createObservation({ title, content, type, domain, focus, metadata, sourceNodeKey, observedAt })
upsertObservation(matchKeys, fields)
linkObservation(observationId, 'opportunity' | 'project' | 'contact', entityId, relationship)
createOpportunity(fields)         // status 'added'
setOpportunityStatus(id, status, { reason?, atNodeKey })
createTask({ title, taskType, contactId?, projectId?, observationId?, dueAt?, nudge, metadata, sourceNodeKey })
logAi({ purpose, componentKey, sourceNodeKey, request, response, context, status })
```

`setOpportunityStatus` always writes `metadata.status_history` (append `{ status, at, node, reason }`). That makes un-parking and the mission reveal easy.

## 4. AI usage

**Stance: mirror, not oracle** (see core principles). Every system prompt for these components includes:

- Use the user's own words. Quote short phrases and reference the source observation id.
- Open observations with "One thing I notice…". Never "You should".
- No diagnosis, no inferred emotions, no guessed motivations, no scores or rankings, no verdicts.
- No forced positivity. A flat or negative outcome is reported plainly.
- Ask at most one question at a time.
- If evidence is thin, say it is thin.

**Logging.** Every call writes an `ai_logs` row: `component_key = node.component`, `source_node_key = node.key`, `purpose` (listed per component), `request`, `response`, `context` (ids of rows used), `status`.

**Reveals persist and regenerate.** On entry, load the latest `ai_logs` row where `purpose` and `source_node_key` match and `user_id` matches. If none, generate. Show the latest only. "Regenerate" adds a row and replaces the display. If the underlying evidence changed since the log's `created_at`, show "Your notes changed. Regenerate?" rather than silently refreshing.

**AI failure never blocks.** Every AI affordance has a manual fallback (empty draft, plain list). Reveals show the raw evidence without commentary if generation fails.

## 5. Shared UI patterns

Build these once; most components are compositions of them.

| Pattern | Behaviour |
|---|---|
| **DraftAndCorrect** | AI proposes text assembled from the user's own earlier words. Shown inline, editable. The user's final version is saved; the original draft is kept in `ai_logs` only. Always shows "Edit anything that isn't right." |
| **GuidedConversation** | One question visible at a time, chat-like, with the user's previous answers collapsed above. Optional AI follow-up (max one per step). Structured fields are extracted at the end and shown for correction, never silently saved. |
| **OneAtATime** | When a step repeats per opportunity, show one at a time with "Next problem" and a progress hint ("2 of 3"). Never a grid of cards to fill. |
| **WorldTask** | For anything done outside the app. Two states: **Go** (what to do, plus the draft or helper) and **Back** ("What happened?"). State comes from the linked `user_tasks` row. On return the screen opens with the Back state, not a menu. |
| **RevealBlock** | An "One thing I notice…" line, the user's own words as evidence beneath it (expandable, linked to the source row), and an optional "Does that sound right?" |
| **ContactPicker** | Searches `user_contacts`; adds a person inline (name, context, how to reach). Also shows `network_context` groups as suggestions. |
| **EvidenceChip** | Small tappable chip showing a source (a quote, a conversation, an observation) that opens it in a side sheet. |
| **SoftCap / HardCap** | SoftCap warns and allows. HardCap disables the extra selection and says why in one sentence. |

## 6. Copy and vocabulary

The user never sees: node, quest, mission progress counts, "viability", "market", "competitor", "validate", "MVP", "pipeline", "SaaS".

**One word per stage, in the data and in the UI.** Do not translate between code and interface, which is what caused the notes / observations / opportunities mix-up.

| Stage | Word everywhere |
|---|---|
| Something you noticed | **observation** |
| An observation you chose to look into | **opportunity** (define it once: "an observation you've decided to look into properly") |
| The one you commit to | **project** |

Do not use "note", "idea" or "problem" as the name of any of these. ("Problem" is fine as ordinary language: "the problem you noticed".)

| System | UI says |
|---|---|
| conversation / interview | conversation, "talked to" |
| feasibility | "what it would take" |
| approach | "how you'd help" |
| parked | "set aside" |
| offer | "what you'd do for them" / "your offer" |

Tone: warm, direct, calm, one question at a time. Never "Great job!", "Amazing!", "You're crushing it". When something goes badly: "Okay. That didn't go the way you expected. What do you notice?"

Buttons: say what happens. "Save", "Next problem", "I've sent it", "Set this one aside". Avoid "Submit" and "Complete".

## 7. Mobile and capture-on-the-go

The Observations page and a future mobile app also write observations. Any component that captures observations must work on a narrow screen with one hand: large tap targets, no tables, bottom-anchored primary action, and drafts saved on blur.

## 8. Schema changes required by Missions 2 and 3

| Change | Reason |
|---|---|
| `opportunity_status` add `'parked'` | Set-aside problems |
| `OBSERVATION_FOCUS_OPTIONS.research`: `feasibility` | Q3 assessment |
| `OBSERVATION_FOCUS_OPTIONS.research`: `approach` (with `domain 'product'`) | Q3 "how you'd help" |
| `OBSERVATION_FOCUS_OPTIONS.conversation`: `customer_interview` | M2 conversations |
| `OBSERVATION_FOCUS_OPTIONS.experiment`: add `problem_test` | M3 tests and responses (`asking` stays for M1). Distinguish with `metadata.kind: 'test' \| 'response'` |
| `user_contacts.roles` includes `'warm'` | M3 warm list (people who took a strong action), scoped by `metadata.warm_for_project_id` |
| `ProgramNode.pacing` and `program_nodes.pacing jsonb` (or read from `metadata.pacing`) | Pacing gate |
| Node unlock time | Derived from `user_progress.completed_at` of the last dependency, no new column needed |
| Default Observations page filter | Show `type = 'observation'` by default. `research`, `conversation`, `experiment` are evidence, reachable via a filter, so the noticing habit is not buried |
| `user_tasks.task_type` values: `'ask'`, `'conversation'`, `'follow_up'` | Real-world steps (verify against existing values) |

## 9. Open items shared by both missions

- **Start over / rework routing.** `complete_program_node` accepts `p_next_node_key`, which can move `current_node_key` backwards. Decide whether `user_progress` rows are kept (recommended) and whether re-completing a node upserts `payload` or appends.
- **"Not now" on an action node.** Recommended: leave the node incomplete, create a `follow_up` task with a nudge, and return the user to the dashboard.
