# Urge development


This is an existing application, not a new project. The product philosophy, mission design, technical architecture, database integration patterns, and visual conventions have already been established. The task is to continue the work consistently with those decisions rather than redesigning the system.

The immediate objective is to implement and complete the Mission 2 and Mission 3 node components, connecting them to the existing data and progress infrastructure.

Before writing any code, ask me to provide a representative, already-implemented Mission 1 node component. Study its structure, interaction patterns, styling, loading and error handling, persistence, and completion behaviour. Do not begin implementation until I have supplied it and we have agreed on the implementation approach.

## What Urge is

Urge helps people move from wanting to start a business to actually taking the steps required to start one.

The central problem is not that aspiring entrepreneurs lack information. It is that they often overthink, wait until they feel ready, avoid talking to potential customers, fear rejection, and struggle to turn an idea into action.

Urge is designed to help people develop the capacity to act, observe the world differently, investigate opportunities, test assumptions, make commercial decisions, and build and operate a real business.

The program is intentionally action-driven. Its success should ultimately be measured by outcomes such as whether people take meaningful action and start businesses, not simply whether they finish lessons or consume content.

Urge is not intended to be a conventional online course, LMS, or curriculum. It is a guided process of entrepreneurial discovery and execution.

Core product principles

Action before confidence. People do not need to feel ready before they begin.

Real-world evidence before theory. Learning should come from observing, asking, testing, and doing.

Experience before interpretation. Help users encounter situations before asking them to draw conclusions.

Evidence before decisions. Separate what happened from what it might mean and what the founder decides to do next.

AI as a mirror, not an oracle. AI can help surface patterns, organise observations, draft questions, and interpret evidence. It must not make consequential entrepreneurial decisions on behalf of the user.

The founder owns the conclusion. The program should help users think better, not substitute its judgement for theirs.

Honest outcomes over manufactured positivity. A weak result, failed test, or abandoned opportunity can be a valuable outcome.

Iteration is part of progress. Revisiting an earlier mission or changing direction is not automatically failure.

Warm, direct, approachable language. Avoid unnecessary jargon, corporate language, motivational clichés, and a patronising coaching tone.

The program should encourage action without implying that every idea is viable or every attempt will succeed.

### The six-mission journey

The overall journey is:

1. Move Before Ready — develop the capacity to act.
2. Discover Opportunities — learn to notice problems and select an opportunity worth investigating.
3. Test the Problem — collect real-world evidence about whether the problem exists and whether people want it solved.
4. How Will This Make Money? — work out a viable money model and commercial economics.
5. Build the Machine — develop the solution, pipeline, and first users.
6. Operate and Learn — operate the business using practical tools and a three-month operational learning period, then decide whether to scale, stop, or continue.

## Implementation Details 
### implementation Status
- Mission 1 - complete
- Mission 2 - Quest 1 and Quest 2 complete
- Mission 3 - quest 3 to mission 6 in incomplete

### How a mission is designed

Missions use a narrative progression:

Situation → Complication → Investigation → Reveal → Action/Decision

A mission establishes the user's situation, introduces a tension or question, guides the user through an investigation, helps them review what happened, and culminates in an action or decision.

The program's node roles are:

- Setup — orient the user, establish context, introduce a question, or prepare them for an activity.
- Investigation — collect information, conduct an exercise, perform a real-world task, or examine evidence.
- Reveal — help the user see patterns, results, tensions, or implications of what they have done.
- Action — turn the learning into a deliberate decision, transition, or persisted outcome.

These roles are reflected in src/program/types.ts and the shared NodeFrame.

A node is not simply a lesson page. It should have a clear purpose in the user's progression. Some nodes capture input, some save real-world tasks, some generate AI-assisted reflections, and others create or promote domain records.

The distinction between capturing data, interpreting it, and committing to a decision must remain explicit.

4. Mission 1 as the established implementation reference

Mission 1, Move Before Ready, has already been implemented and refined.

Its current definition is in src/program/mission1.ts. It should be treated as an implementation reference for:

- Mission and node configuration.
- Component registry conventions.
- Node component interfaces.
- Interaction patterns and form behaviour.
- Persistence and completion handling.
- Loading, validation, and error states.
- Typography, spacing, hierarchy, and responsive layout.
- The relationship between node content and the shared page frame.

The visual system is already established. Do not propose a new design system or revisit typography decisions without a concrete problem that requires it.

### How i will share data for your understanding
I will give you code in batches
- Batch 1: Program details missions, types and mission index (attached with this message)
- Batch 2: App Structure, pages routes
- Batch 3: Node Component Rendering and Progress
- Batch 4: Data, nanostores, actions and Supabase Types
- Batch 5: Hydration. context and AI integration
- Other clarifications based on missions

## Tasks
- Go through the provided code and understand implementation
- understand urge goal and application structure
- Current Focus is Complete mission 2 and mission 3
- Keep implementation, language and style excatly similar to current imlementation

