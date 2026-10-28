
## Batch 1: Program details missions, types and mission index 
Shared
## Batch 2: App Structure, pages routes

- Nanostore is the source of truth for the application
- Nanostores are hydrated through layouts
- All data fetching happens through action files placed in src/actions
- types, schema, stores are defined in src/lib folder
- Node details are read from mission files in src/program
- Each node has a component registered which is in src/components/program/componentRegistry.ts
  - Node component is implemented to be independent and has access to definition from mission<number>.ts and nanostores hydrated
  - progress is handles by NodeRenderer so node component don implemnet progress but use onComplete passed by NodeReneder component.

## App Routes
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
        - src/app/(platform)/program/layout.tsx - Hydrates Mission context
        - src/app/(platform)/program/mission/[missionKey]/page.tsx - one page renders all nodes
    - src/app/(platform)/layout.tsx - Hydrates user information
- src/app/auth
    - src/app/auth/callback/route.ts
- src/app/favicon.ico
- src/app/globals.css
- src/app/layout.tsx
- src/app/page.tsx

### src/app/(platform)/layout.tsx

```tsx
import type { ReactNode } from 'react';

import { UserHydrator } from '@/components/hydrators/UserHydrator';
import { AppShell } from '@/components/layout/AppShell';
import { getAuthenticatedUser, getCurrentProfile } from '@/actions/auth';
import { getCurrentProgramContext } from '@/actions/user-context';

interface PlatformLayoutProps {
  children: ReactNode;
}

export default async function PlatformLayout({ children }: PlatformLayoutProps) {
  const user = await getAuthenticatedUser();
  
  // Fetch both sets of data in parallel to keep loads fast
  const [profile, userContext] = await Promise.all([
    getCurrentProfile(user.id),
    getCurrentProgramContext(user.id)
  ]);

  return (
    <UserHydrator
      user={user}
      profile={profile}
      userContext={userContext}
    >
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </UserHydrator>
  );
}

```
### src/app/(platform)/program/mission/[missionKey]/layout.tsx
```tsx
import { ReactNode } from 'react';
import { getMissionRequirements } from '@/lib/context/requirements';
import { fetchMissionContext } from '@/actions/context';
import { getProgramSubscriptionStatus } from '@/actions/subscription';
import { MissionContextHydrator } from '@/components/hydrators/MissionContextHydrator';
import { TrialPaywall } from '@/components/program/TrialPaywall';
import { PageShell } from '@/components/layout/PageShell';

export default async function MissionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ missionKey: string }>; // 1. Type params as a Promise
}){
  // Await the params to unwrap them
  const resolvedParams = await params;
  const missionKey = resolvedParams.missionKey;

  // 1. Check Subscription Status
  const status = await getProgramSubscriptionStatus();
  
  // 2. The Trial Gate
  if (missionKey !== 'mission-1' && status === 'trialing') {
    return (
      <PageShell>
        <TrialPaywall missionKey={missionKey} />
      </PageShell>
    );
  }

  // 3. Normal Flow: Fetch Context & Render
  const requiredResources = getMissionRequirements(missionKey);
  const contextData = await fetchMissionContext(requiredResources, missionKey);

  return (
    <>
      <MissionContextHydrator contextData={contextData} />
      {children}
    </>
  );
}

```

### src/app/(platform)/program/mission/[missionKey]/page.tsx
```tsx
'use client';

import { useStore } from '@nanostores/react';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

import {
  $programState,
  programStateActions,
} from '@/lib/stores/program-state';

import { $nodeResources } from '@/lib/stores/resources';

import { $progress } from '@/lib/stores/progress';

import {
  getNode,
  getMissionForNode,
} from '@/program/index';

import { PageShell } from '@/components/layout/PageShell';
import { ContextRail } from '@/components/layout/ContextRail';
import { NodeRenderer } from '@/components/program/NodeRenderer';
import { ContextRailResources } from '@/components/program/ContextRailResources';

import { MissionJourneyHeader } from '@/components/layout/program/MissionJourneyHeader';
import { MissionJourneyRail } from '@/components/layout/program/MissionJourneyRail';

import { Button } from '@/components/ui/button';

export default function MissionPage() {
  const {
    isHydrated,
    currentNodeKey,
  } = useStore($programState);

  const resources = useStore($nodeResources);
  const progress = useStore($progress);

  if (!isHydrated || !currentNodeKey) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const activeNode = getNode(currentNodeKey);
  const mission = getMissionForNode(currentNodeKey);

  if (!activeNode || !mission) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />

          <p>
            Configuration not found for node:{' '}
            <span className="font-mono">
              {currentNodeKey}
            </span>
          </p>
        </div>
      </PageShell>
    );
  }

  /*
   * Determine the current quest.
   *
   * Setup/reveal nodes that sit outside a quest will not
   * have a current quest.
   */
  const currentQuestIndex = mission.quests.findIndex((quest) =>
    quest.nodes.some((node) => node.key === currentNodeKey)
  );

  const currentQuest =
    currentQuestIndex >= 0
      ? mission.quests[currentQuestIndex]
      : null;

  /*
   * Previous node is still determined from the node's
   * dependency chain. We are deliberately not changing
   * Back behavior as part of this layout refactor.
   */
  const prevNodeKey = activeNode.dependencies?.[0];

  const handleBack = () => {
    if (prevNodeKey) {
      programStateActions.setCurrentNode(prevNodeKey);
    }
  };

  /*
   * Context resources remain exactly as they were.
   */
  const railResources = resources.filter(
    (resource) =>
      resource.node_key === currentNodeKey &&
      (
        resource.role === 'supplementary' ||
        resource.role === 'ambient'
      )
  );

  const contextContent = (
    <ContextRail>
      <ContextRailResources resources={railResources} />
    </ContextRail>
  );

  return (
    <PageShell context={contextContent}>
      <div className="w-full space-y-10">

        {/* Mission identity */}
        <MissionJourneyHeader
          nodeKey={currentNodeKey}
        />

        {/* Mission journey */}
        <MissionJourneyRail
          mission={mission}
          currentNodeKey={currentNodeKey}
          completedNodes={progress.completedNodes}
        />



        {/* Current node */}
        <main>
          <NodeRenderer
            key={currentNodeKey}
            nodeKey={currentNodeKey}
          />
        </main>

        {prevNodeKey && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="-ml-3 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to previous
            </Button>
          </div>
        )}

      </div>
    </PageShell>
  );
}

```

## Hydration
We hydrate the nanostore through layouts.
- src/app/(platform)/layout.tsx - is authenticated part of the app and it hydrates user
- src/app/(platform)/program/mission/[missionKey]/layout.tsx - We hydrate mission specific data based on current mission for a user. We use MissionHydrator Component.
  - src/lib/context/requirements.ts - provides what to hydrate
  - src/actions/context.ts - has fetchers for specici resources

## Attached
Hydrators
- src/components/hydrators/MissionContextHydrator.tsx
- src/components/hydrators/ProgramHydrator.tsx
- src/components/hydrators/UserHydrator.tsx

## Nanostores
- src/lib/stores/progress.ts - all user node progress
- src/lib/stores/program-state.ts - tracks current node
- src/lib/stores/user-context.ts - user profile amd user_program_context
- src/lib/stores/observations.ts - one resource type 

## Supabase type
- src/database.types.ts


## Next
I will share the following 
1. node rendering, component registration and progress
2. Style/Layout 


## Node Rendering and Progress

# Sample nodes
## 'situation_explorer': SituationExplorer - mission 1
attached file - src/components/program/mission-1/SituationExplorer.tsx
## 'fear_explorer': StandardSetupFrame - mission 1
uses common component which just renders description and text from node entry in mission file
attached file - src/components/program/common/StandardSetupFrame.tsx
## 'low_threshold_ask': RealWorldExperiment - mission 1
Uses common component to setup task outside app to go out and interact with people. It has prompt and way to save reflection in user_observations table
attached file - src/components/program/common/RealWorldExperiment.tsx

## Main Ideas for mission 2
- user_observations are universal and users will use to save observations from different part of the journey. 

### workflow
1. Users observe problems and save it to user_observations tables
2. Users add additional details to the observed problems
3. Qualify the observed problems based on three criteris see node m2-q1-qualify
4. They pick 3 observed problem which seem to be opportunities they want to investigate further, we create 3 oportunities in user_opportunities table ( i am debating this, if we can just have a flag is_opportunity in user_observations table and add aditional field for investigating solution to the table rather than having a separate user_opportunities table)
5. They talk to people who they observed having the problem to understand problme for their perspective
6. After qualifying and talking to people with problem (potential customers), they investigate How can they solve the problem
7. Based on three factors qualification, interviews, and shape and viability of solution they pick one to test ( become a project and we save it to user_projects table)

## Note on mission 2 Components

### 'm2-q1-setup' 
- This node bridges mission 1 outcomes with what users will do in mission 2
- component: src/components/program/mission-2/OpportunitySetup.tsx
  - We let users bring their existing idea for business before they start looking for new one through ObservedProblemExtractionForm component. The is to keep the process simple and not make users feel like they are filling out forms. We use AI to extract data based on problem_details. and saved it to user_observations table with few presets. User who dont have any existsing idea and proceed without adding one.
  - idea is to have all the problem observation consistent so when they start working on them to qualify them and pick three opportunities from them, all problems are in same level of details. - refer: src/lib/types/observations.ts
  - user_observations entries for problems -> type: 'observation', domain: 'problem', focus
- focus for domain 'problem' 
  - personal: 'Your everyday life',
  - zone_of_influence: 'People and places you know',
  - market_trends: "What's changing around you",
  - lived_experience: 'What you know and can do',

### 'm2-setup'
just render description in src/components/program/mission-2/ObservationSetup.tsx

### 'm2-q1-observe'
this renders src/components/program/mission-2/ObservationCapture.tsx which has 4 parts to it.
1. Initial adding of observation same as m2-q1-setup node using ObservedProblemExtractionForm component.
2. Problem Hint: Based on User context AI recommends what to look for ( not implemented will do this after we finish mission 3 not critical).
3. Add taks, users can add things they want to explore as tasks saved in user_tasks
4. List of saved observation where user can fill out futher details who, what, where.

They need minimum of 5 completed observations to progress. 

### 'm2-q1-qualify'
User will qualify all the observed problems in src/components/program/mission-2/ObservationQualification.tsx. basically they are trying to answer three simple questions in (yes| no| not_sure) - refer: src/lib/types/observations.ts
1. understands - do they understand the problem
2. cares -  Do they care about the problem
3. can_solve - Do they think they can solve the problem?

But before they answer these three main qualification question they have to figure out related questions. This gives them a clear idea how to qualify.
- workaround: detailDraft.workaround.trim() || null,
- current_option: detailDraft.current_option.trim() || null,
- frequency: detailDraft.frequency.trim() || null,
- cost: detailDraft.cost.trim() || null,
- why_unsolved: detailDraft.why_unsolved.trim() || null,
- can_reach:

### 'm2-q1-reveal'
src/components/program/mission-2/ObservationPatternsReveal.tsx use AI to find patterns in what users observed

### 'm2-q1-action'
They pick three to convert to opportunity. This is where i have has my reservations. We have been using user_observations as staging . We dont really do much with opportunity apart from carrying out user interviews and solution assessment. I was thinking why cant we move to user_observations table with opportunity flag. src/components/program/mission-2/PromoteToOpportunities.tsx

### 'm2-q2-setup'
we are using src/components/program/mission-2/ConversationSetup.tsx. We just tell users what to look for when we interview them. I think we have missed the part of telling them who to interview (people with observed problems)

### 'm2-q2-conversations'
we are using src/components/program/mission-2/CustomerConversations.tsx. 

This component give users few options
- save contact of the person they are interviewing to user_contacts
- Save text from interview to user_observations

Note: One thing I want to be very intentional about is not make the app become work. I want users to use the journey to build their business not complete the journey on app. Having additional information help provide AI with additional context but thats totally optional. 
### 'm2-q2-reveal'
src/components/program/mission-2/ConversationReflection.tsx
this unlike previous reveal node does not use AI analysis, but it lets user synthesize what they learnt from interviews.

### 'm2-q2-action'
src/components/program/mission-2/ConversationAction.tsx
this one make user think about things they still want to explore about opportunities and add it to tasks before they continue.



## Task
- Analyze the components i shared to see if they do what i have described above
- Help me decide whether to have user_opportunities table or merge it with user_observations
- I will give you how i want to go about next quest (quest 3)



perfect. I agree and i made mistaken user_interactions with user_observation in m2-q2-conversations node. I also agree with user_opportunities table. it gives us flexibility for later. Now this is how i would implement rest of node for mission 2. More of less its same but i have changed actions.

1. PathSetup.tsx (m2-q3-setup / path_setup): 

We have to tell them about how we want them to shift their focus from problem to solution, We will revisit this in more details again but this is them getting started with exploring solutions. 

2. PathAssessment.tsx (m2-q3-assessment / path_assessment): 

I want to keep this fairly straightforward and and i also think we should swap m2-q3-assessment with next node m2-q3-approach. I think it makes sense to first think about solution and then ask whether it is feasible. I want user to ask themselves the following.
- Do i have skills required to do this? if no. then they should ask do i know others who would help me build this?
- How much time would this need and do i have that much time?
- Does this need a lot of money?
- Does this involve any spcialised regulations or legal criteria ( we can have AI as helper here)


3. HelpApproach.tsx (m2-q3-approach / help_approach): The 4 solution archetypes (do_for_them, tool, connect, teach), selection of primary approach, and narrative description.  

We should swap this with above node
And make this very illustrative. and make them understand how same problem can be solved in different ways and they should imagine in which of the solutions would they be best suited.

4. PathReveal.tsx (m2-q3-reveal / path_reveal): Side-by-side comparison with AI reflection and regeneration.   

- We want AI to reveal few things specially about money, time for give problem/opportunity and choice of solution. Ai should also look at the user context and give them opnion on suitability maybe even leave them with few questions to think about?

5. ChooseOpportunity.tsx (m2-q3-action / choose_opportunity): Commit to one project (or park/choose none); enforces a 2-day cooling-off gap with an explicit bypass option for testing/development.   

I would not choose oportunity here. i would give user some more time and go research. think about it for couple of days before jumping in to picking one. Just look up stuff, Maybe point them to related subreddit or other forum so they can read about these opportunities more. 


6. Mission2Reveal.tsx (m2-reveal / mission_transformation_synthesis): Full journey synthesis showing the path from initial idea to chosen project.   

7. Mission2Action.tsx (m2-action / mission_transfer_action): 

This is where i would make them pick one opportunity to test.   


## Attached file 

1. src/actions/opportunities.ts


Notes:
- i dont have src/lib/stores/opportunities.ts
- i dont have src/actions/opportunities.ts
- i dont have src/lib/stores/projects.ts
- i dont have src/actions/projects.ts

src/lib/types/opportunities.ts

```ts
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/database.types';
import type { ProblemDetails } from '@/lib/types/observations';

export type UserOpportunityRow = Tables<'user_opportunities'>;

export type UserOpportunity = Omit<
  UserOpportunityRow,
  'problem_details'
> & {
  problem_details: ProblemDetails;
};

export type UserOpportunityInsert = Omit<
  TablesInsert<'user_opportunities'>,
  'problem_details'
> & {
  problem_details?: ProblemDetails;
};

export type UserOpportunityUpdate = Omit<
  TablesUpdate<'user_opportunities'>,
  'problem_details'
> & {
  problem_details?: ProblemDetails;
};

export type UserOpportunityStatus =
  UserOpportunityRow['status'];

export type UserOpportunityMetadata = Record<string, Json>;
```