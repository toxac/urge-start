# Urge Architecture (with status)
I am building an app for first time entrepreneur. This app is aimed at everyone who has been thinking of starting a business but haven't. You can read more about the core principles of urge in attached core-principle.md. I will outline how i want to structure the app and handle core functionality.

## Stack
this is a nextjs app with supabase which uses tailwind and shadcn components and has following dependencies

```json
"dependencies": {
    "@base-ui/react": "^1.8.0",
    "@hookform/resolvers": "^5.9.1",
    "@nanostores/react": "^2.0.1",
    "@phosphor-icons/react": "^2.1.10",
    "@supabase/ssr": "^0.12.7",
    "@supabase/supabase-js": "^2.117.2",
    "@tailwindcss/typography": "^0.5.20",
    "class-variance-authority": "^0.7.1",
    "cn": "^0.4.0",
    "lucide-react": "^1.48.0",
    "nanostores": "^1.5.4",
    "next": "16.3.6",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-hook-form": "^7.89.0",
    "shadcn": "^4.21.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22.20.4",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.6",
    "tailwindcss": "^4",
    "tsx": "^4.23.15",
    "typescript": "^5",
    "vitest": "^5.0.2"
  }

```

## Program Mission Structure
Urge is design around program which is a transformational journey to starting a business. program is structured as six missions each having following structure

### Mission Flow
- mission
    - setup (node) : this asks/acknowledges where user are in the journey in real life and in their urge program, introduces a complication/questions which user must find answer to in the quests.
    - quests :
        - quest 1
            - setup (node)
            - investigation 1 (node)
            - investigation 2 (node)
            - ..
            - investigation n (node)
            - reveal (node) - synthesis of what users found, with analysis
            - action (node) - what action will user take based on the findings
        - quest 2
        - quest ..
        - quest n
    - reavel (node)- synthesis and analysis of main question for the mission
    - action (node) - what will user do
### Program Nodes
node types describe the role a step plays in the user's journey, not simply the kind of screen it displays. A node might be a conversation, a reflection, an inventory, an exercise, or a real-world challenge. What makes it a particular type is what it does in the overall experience.

- **Setup Node** : Establish the user's situation, context, intention or starting point before asking them to investigate the big question or complication that arises from their current state in the journey. This could have following elements reflected in the user facing component.
    - Situation exploration
    - Motivation and intention
    - Starting-point capture
    - Context setting
    - Baseline reflection
    - Setting up question/complication to investigate

- **Investigation node**: Help the user investigate something about themselves, other people, a problem, an opportunity or a possible business. Investigation is the most flexible node type. It can happen inside the app or out in the world. It can involve thinking, recording, exploring, talking to people or trying something. Variation could be 
    - A. Guided reflection: Questions help users examine their own experience, beliefs, motivations, assumptions or fears. Example: What makes asking someone for help uncomfortable for you?
    - B. Inventory and mapping: Capture what the user has, knows, can do, has access to, or has noticed. The output may become reusable structured data. Example: Map skills, experience, resources, relationships and constraints.
    - C. Observation and discovery: Examine real situations, recurring problems, people's behaviour or unmet needs. Example: Notice a recurring problem in a group of people the user understands.
    - D. Conversations and research: Gather evidence from customers, peers, experts, communities or other sources. Example: Talk to potential customers about how they currently deal with a problem.
    - E. Real-world challenge or experiment Ask the user to do something outside the app and return with what actually happened. Example: Ask for a favour, request a coffee-shop discount, or try to get ten rejections.
    - F. Comparison and evaluation: Compare alternatives against evidence or explicit criteria, without prematurely deciding for the user. Example: Compare three candidate opportunities based on the problem, customer access and evidence gathered.
- **Reveal node** : Bring together the evidence collected during a quest so the user can see a pattern, tension, gap, discovery or implication. A reveal is more than a summary of previous answers. It helps the user make sense of what happened without taking ownership of the conclusion away from them. This node and setup will use AI to enhance the quality of experience and analysis. A reveal might produce: A clearer understanding or insight, Evidence for or against an assumption, A visible gap or unresolved question, A set of possible next steps and/or, Information that makes the subsequent action meaningful. variations include:
    - Evidence synthesis: Brings several observations together. What did the user discover about their starting situation?
    - Pattern recognition: Surfaces recurring themes or connections.Several people struggle with the same problem.
    - Expectation versus reality: Compares predictions with actual outcomes.	The user expected rejection but received a helpful response.
    - Strengths and gaps: Makes available resources and missing capabilities visible.	The user has relevant skills but lacks customer access.
    - Tension or contradiction: Highlights where beliefs, intentions and actions differ.	The user says they want to start but repeatedly avoids asking people.
    - Opportunity or implication: Surfaces what the evidence might suggest for the next stage.	A particular customer problem merits further investigation.
    - Personal synthesis: Brings together a longer stretch of the user's journey.	What has changed, what remains difficult, and what the user now knows about themselves.
- **Action node** : Turn what the user has discovered into a consequential choice, commitment or change in their persistent workspace. We explicitly moved away from treating the fourth step as merely a “Decision” node. We called it an Action node because choosing something is only one of several things the user may need to do. variation include:
    - Decision: A choice is recorded.	Select an opportunity to investigate further.
    - Commitment: The user makes a specific commitment.	Commit to speaking with three potential customers.
    - Task creation: One or more tasks are added to the user's task list. Contact people who can help fill a capability gap.
    - Follow-up: A next step is recorded after an experience.	Decide what to do differently after an uncomfortable ask.
    - Opportunity selection: An opportunity is selected, shortlisted or moved into testing.	Choose one candidate from the top three.
    - Project creation: An opportunity becomes a project.	Turn a validated problem into a project to develop an offer.
    - Project update: An existing project is changed.	Update the offer, target customer or current status.
    - Outcome recording: A consequential result or explicit non-action is recorded.	Record “not now,” a decision to stop, or a commitment to revisit.
    - Custom domain action: A mission-specific operation changes persistent data.	Save an offer, create a test plan or record a business decision.

### Relevant Files 
- src/program/index.ts 
- src/program/mission1.ts
- src/program/mission2.ts
- src/program/mission3.ts
- src/program/mission4.ts
- src/program/mission5.ts
- src/program/mission6.ts
- src/program/types.ts - program , mission and node types

### program status 
All the missions files are complete nodes are extracted from mission files and saved to  supabase program_nodes table. I also have a sync script which syncs mission files to database rows. 
- scripts/sync-program.ts

## App Structure
### Rendering program: 
    - we have program files which are in src/program folder and app uses this to render nodes. Data in supabase table program_nodes are purely to provide reference to other tables. 
    - Each node will have a correspoding UI component, some can use common components as well. components will be saved in src/components/<mission-number>/ folder and src/components/common/
    - we will have a component registry and Node renderer component 
    - I am planning to have one page to render all nodes. so we will have program/mission/<mission-key>. This page will load entire mission node and show users nodes in sequences based on progress nanostore.
    - Layout: sidebar + content container (which includes right context rail). i have this file which can be refined for data and hydration.

### App Routes
- src/app
- src/app/(auth)
    - src/app/(auth)/forgot-password
    - src/app/(auth)/login
    - src/app/(auth)/reset-password
    - src/app/(auth)/signup
    - src/app/(auth)/layout.tsx
- src/app/(platform)
    - src/app/(platform)/dashboard
    - src/app/(platform)/observations
    - src/app/(platform)/projects (opportunity+ projects)
    - src/app/(platform)/events
    - src/app/(platform)/network (user network/contacts)
    - src/app/(platform)/community (forums and feeds)
    - src/app/(platform)/program
        - src/app/(platform)/program/layout.tsx
        - src/app/(platform)/program/mission/[missionKey]/page.tsx
    - src/app/(platform)/layout.tsx
- src/app/auth
    - src/app/auth/callback/route.ts
- src/app/favicon.ico
- src/app/globals.css
- src/app/layout.tsx
- src/app/page.tsx

## Data
I want to build this from scratch in a clean, simple, and scalable manner with following criteria. I built a version and it was not something that i liked so i am completely scraping it. 

### Data Fetching from supabase
- I want this to happen exclusivley through server actions whereever possible. one file for every table with base crud functions and custom function if needed for node. I dont mind having even custom function per node as long as they are in same folder
- refer to database.types.ts for supabase datatypes

### Browser Data store
- I want to use nanostores for local data which makes front end easier to handle and we  dont have to unnecessarily fetch data which is frequently needed in a given context.
- Each nanostore should have functions to update on every database operation that way we have a simple way to keep nanostore synced with supabase

### Hydration 
- Hydration will be context and we will use hydrators in the layout files for different routes to ensure stores are hydrated with the data we will need in the components.
- we will have to create simple hydration policy based on mission keys for the program route. that way we have relevat artifact data available within misssion and nodes.

### Validations
We will use client side validation for forms using zod and react-hook-forms. We can save all the validation schemas in lib/schema

### Component, store, data and progress
#### progress
- We have two tables which handle progress
    1. user_progress - records each node completion 
    2. user_program_state - keep track of current node, this is useful when user might iterate, go back to certain node. When app start we take user to the current node and then they can proceed sequentially back or forwward.
- I would keep this too very simple have nanostore for both, use server action and progress lib which has function for node completion that takes node-key and adds a row to user_progress, gets next node and sets that as current node and return current node so maybe something like {current_node: node-key, progress: saved progress row}. We call this function from node component and then use nanostore update to sync the stores.
- flow would then be we open the current node, when we complete task inside component after handleSubmit in the form is success we call node completion function and use the returned value to update nanostores.

#### Component
Component will some some kind of form or database action in most cases with button to go next(enabled only if current node is complete) or previous. Component will be responsible for mutating data on the table it depends on, it will fetch the data if data exists and display (in case user is revisting this node). or use actions to update table and then handle progress.
This gives us flexibility of implementing component the way we like, it has standard function to manage completion/progress and its own way to fetch and save data.


## Tasks
- Go through the uploaded files and code and understand it
- Ask all the questions for clarity
- Recommend simple implementation plan which keeps everything simple
- First lets look at data handling, hydration, progress, component setup 





