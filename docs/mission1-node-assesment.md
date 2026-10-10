Below is the markdown with the component key mapped to its actual React component from `componentRegistry.ts`:

# Mission 1 — Move Before Ready

## Mission Setup

### `m1-setup` — Where are you starting from?

- **Key:** `m1-setup`
- **Title:** Where are you starting from?
- **Description:** Before you decide what to build, take a moment to see where you are right now.
- **Component:** `situation_explorer` `<SituationExplorer>`

### Notes For Enhancement

just move the text in one paragraph.

Otherwise its pretty good

---

## Quest 1 — Draw the Line

**Quest key:** `q1`  
**Quest title:** Draw the Line

### `m1-q1-setup` — What is really keeping you from starting?

- **Key:** `m1-q1-setup`
- **Title:** What is really keeping you from starting?
- **Description:** There may be practical reasons for waiting. There may also be fear, uncertainty, or assumptions hiding underneath them. Let’s look at what is really going on.
- **Component:** `barrier_reflection` `<StandardSetupFrame>`



**Notes For Enhancement**

1. Explanation can be a bit better. This one seems quite vague

2. Button could be on the right

current content coming from description:

```
What is really keeping you from starting?

There may be practical reasons for waiting. There may also be fear, uncertainty, or assumptions hiding underneath them. Let’s look at what is really going on.
```

--- 



### `m1-q1-barriers` — What has been stopping you?

- **Key:** `m1-q1-barriers`
- **Title:** What has been stopping you?
- **Description:** Look more closely at the barriers you named. Some may be real constraints. Others may be fears or assumptions that have become reasons to wait.
- **Component:** `why_havent_you_started` `<WhyHaventYouStarted>`



**Notes on enhancement**

- Current behaviour: we select one or more option and them we add more details to each one after another

- Suggested behaviour: Click on a card and dialog opens up instanstly where users can add more details. And once user has added the text we can see in UI which one have user input which they can edit or entirely deselect the option. 

- We should also explain this in paragraph .



### `m1-q1-motivation` — What keeps bringing you back?

- **Key:** `m1-q1-motivation`
- **Title:** What keeps bringing you back?
- **Description:** Something keeps pulling you toward this, even when the barriers are still there. That pull matters.
- **Component:** `motivation_explorer` `<MotivationExplorer>`


### `m1-q1-future` — What would be different?

- **Key:** `m1-q1-future`
- **Title:** What would be different?
- **Description:** Starting a business is not the goal by itself. Something about your life, work, or circumstances is making you want to do this.
- **Component:** `future_reflection` `<FutureStateExplorer>`

### `m1-q1-quit` — What might make you quit?

- **Key:** `m1-q1-quit`
- **Title:** What might make you quit?
- **Description:** Knowing what could make you stop is useful. It gives you a chance to recognize those moments before they arrive.
- **Component:** `quit_condition_explorer` `<QuitConditionExplorer>`

### `m1-q1-reveal` — What is actually driving you?

- **Key:** `m1-q1-reveal`
- **Title:** What is actually driving you?
- **Description:** Look across what you have said. There is a tension between what is holding you back and what keeps pulling you forward.
- **Component:** `commitment_synthesis` `<CommitmentSynthesis>`

### `m1-q1-action` — Draw your line.

- **Key:** `m1-q1-action`
- **Title:** Draw your line.
- **Description:** You do not need to promise that you will never hesitate again. You need a way to keep moving when hesitation shows up.
- **Component:** `commitment_builder` `<CommitmentBuilder>`

---

## Quest 2 — What You Already Have

**Quest key:** `q2`  
**Quest title:** What You Already Have

### `m1-q2-setup` — You are not starting from zero.

- **Key:** `m1-q2-setup`
- **Title:** You are not starting from zero.
- **Description:** It is easy to focus on everything you do not have yet. Before you do, let’s look at what is already around you.
- **Component:** `asset_inventory_intro` `<StandardSetupFrame>`

### `m1-q2-inventory` — What resources are already within reach?

- **Key:** `m1-q2-inventory`
- **Title:** What resources are already within reach?
- **Description:** Resources are not just money. Time, tools, spaces, information, technology, and other forms of access can all change what is possible.
- **Component:** `resource_inventory` `<ResourceInventory>`

### `m1-q2-network` — Who is already within reach?

- **Key:** `m1-q2-network`
- **Title:** Who is already within reach?
- **Description:** You do not have to build everything alone. Start with the people you already know or can realistically approach.
- **Component:** `contact_inventory` `<NetworkMapper>`

### `m1-q2-capabilities` — What can you already do?

- **Key:** `m1-q2-capabilities`
- **Title:** What can you already do?
- **Description:** You have probably learned more useful things than you give yourself credit for. Look for capabilities you already use to solve problems.
- **Component:** `capability_inventory` `<CapabilityInventory>`

### `m1-q2-experience` — What have you already lived through?

- **Key:** `m1-q2-experience`
- **Title:** What have you already lived through?
- **Description:** Your experience is bigger than your job history. Work, hobbies, side projects, communities, failures, and problems you have solved can all give you useful context.
- **Component:** `experience_inventory` `<ExperienceMiner>`

### `m1-q2-reveal` — You have more to work with than you thought.

- **Key:** `m1-q2-reveal`
- **Title:** You have more to work with than you thought.
- **Description:** Now compare what you thought you were missing with what you actually have available.
- **Component:** `asset_reveal` `<AssetReveal>`

### `m1-q2-action` — What still needs attention?

- **Key:** `m1-q2-action`
- **Title:** What still needs attention?
- **Description:** You do not need to close every gap before you begin. Identify the ones that actually matter now.
- **Component:** `gap_action` `<GapAction>`

---

## Quest 3 — Make the Ask

**Quest key:** `q3`  
**Quest title:** Make the Ask

### `m1-q3-setup` — What makes asking hard?

- **Key:** `m1-q3-setup`
- **Title:** What makes asking hard?
- **Description:** Asking can feel surprisingly difficult. You might worry that what you have is not good enough, that you are bothering someone, or that they will judge you. That hesitation can keep you working alone for much longer than you need to.
- **Component:** `asking_baseline` `<AskingBaseline>`

### `m1-q3-visible` — Let people see you starting.

- **Key:** `m1-q3-visible`
- **Title:** Let people see you starting.
- **Description:** You do not need a finished business, polished idea, or impressive story. Start by letting the Urge community see who you are and what brought you here.
- **Component:** `visibility_action` `<VisibilityAction>`

### `m1-q3-squad` — Who could help you move?

- **Key:** `m1-q3-squad`
- **Title:** Who could help you move?
- **Description:** You do not need a co-founder or a big team. There are people who could help you see something differently, learn something, make progress, or get through a difficult moment.
- **Component:** `squad_builder` `<SquadBuilder>`

### `m1-q3-ask` — Make a real ask.

- **Key:** `m1-q3-ask`
- **Title:** Make a real ask.
- **Description:** Now ask someone for something that matters. The answer is theirs to give. Your job is not to control the outcome. Pay attention to what actually happens.
- **Component:** `real_world_ask` `<RealWorldExperiment>`

### `m1-q3-reveal` — What did you expect? What actually happened?

- **Key:** `m1-q3-reveal`
- **Title:** What did you expect? What actually happened?
- **Description:** Before you made the ask, you probably had some idea of how it would go. Put that prediction beside what actually happened.
- **Component:** `prediction_reality_reveal` `<PredictionRealityReveal>`

### `m1-q3-action` — Keep the door open.

- **Key:** `m1-q3-action`
- **Title:** Keep the door open.
- **Description:** One interaction does not change how you behave overnight. Choose a small practice that will help you keep approaching people instead of retreating into figuring things out alone.
- **Component:** `learning_action` `<LearningAction>`

---

## Quest 4 — Seek the No

**Quest key:** `q4`  
**Quest title:** Seek the No

### `m1-q4-setup` — What are you afraid will happen?

- **Key:** `m1-q4-setup`
- **Title:** What are you afraid will happen?
- **Description:** A no can feel much bigger before you hear it. This is a chance to look closely at what you are afraid will happen instead of letting that fear make the decision for you.
- **Component:** `fear_explorer` `<FearExplorer>`

### `m1-q4-warmup` — Start with a small ask.

- **Key:** `m1-q4-warmup`
- **Title:** Start with a small ask.
- **Description:** Make a low-stakes ask where hearing no would be uncomfortable but not costly.
- **Component:** `low_threshold_ask` `<RealWorldExperiment>`

### `m1-q4-stretch` — Now make a harder ask.

- **Key:** `m1-q4-stretch`
- **Title:** Now make a harder ask.
- **Description:** Push a little further. Choose an ask that feels more uncomfortable but is still safe to make.
- **Component:** `fear_challenge` `<RealWorldExperiment>`

### `m1-q4-reveal` — What actually happened?

- **Key:** `m1-q4-reveal`
- **Title:** What actually happened?
- **Description:** Compare what you feared would happen with what actually happened. What did you notice?
- **Component:** `fear_evidence_reveal` `<FearEvidenceReveal>`

### `m1-q4-action` — How will you respond next time?

- **Key:** `m1-q4-action`
- **Title:** How will you respond next time?
- **Description:** You cannot control whether someone says yes. You can decide what you do when uncertainty or fear shows up again.
- **Component:** `behavior_commitment` `<FearAudit>`

---

## Mission Reveal

### `m1-reveal` — Look at how far you moved.

- **Key:** `m1-reveal`
- **Title:** Look at how far you moved.
- **Description:** You started with uncertainty. Now look at what you actually did, what happened, and what you learned from acting instead of waiting.
- **Component:** `mission_transformation` `<Mission1Reveal>`

---

## Mission Action

### `m1-action` — How will you move before ready?

- **Key:** `m1-action`
- **Title:** How will you move before ready?
- **Description:** The goal is not to become fearless or perfectly confident. It is to keep moving when uncertainty shows up.
- **Component:** `mission_transfer_action` `<Mission1Action>`

