# Notes on mission 1 implementation

Key idea of this mission is for users to reflect and understand where they are right now, what they have with them and what they might need to work on. Test themselves for resolve, handling fear, stepping out of their comfort zone and commiting to the journey. 

## Overall Flow of the mission

I see this in two parts one introspective and other going out in the world. But both to find out why have they not started. what is stopping them?

- Quest 1: We investigate their motivations, barriers and fear -> Action they commit time resources to starting 

- Quest 2: They explore what they already have. idea is nobody starts with everything figured out but everything is at different levels when they start and even if they have very little, its not a problem to work on those, This should not stop anyone.

- Quest 3: While internally they might have the resolve, drive and be commited but if they fail to go infront of people and tell them what they need or what they are trying to sell. They wont get very far. This makes them realize this not by introspection but by making them reach out and talking to people.

- Quest4: While being in front of people trying to ask them for things is difficult, hearing no when they do muster the courage to ask makes all their fears come alive. Nobody likes what i have to offer, nobody needs this, they dont like me and so on. This quests makes them approach people and ask them for things when they know they are going to hear no. Its about making them comfortable in hearing no and how it can be something they can learn from and not something that makes them retreat in their shell.

- mission reveal: Assessment of where users are what they learnt and experience through the investigations

- mission action: we want to create few tasks that users can work in parallel on while they move on to next mission

## m1-setup : mission setup

Users have joined urge for different reasons with different motivations. User might have experienced different triggers could be horrible job, stagnations, dream/desire to start something. some might have an idea. We want to establish few things here. this is quite light where we want to emphasize this question "Why havent they started?" the component will have 2 steps 

**Step 1**: Establish why they are here, what got the urge in them to start?

- We could just ask them what got them here why did they join urge in a paragraph

- Feed the response to AI and which would analyse to see if user response was related to an idea or something else: Ai response will have two things 1 hasIdea and response (acknowledment)
  
  - "hasIdea == true":  Based on the idea we will ask them few questions so that we can save it in user_observations so it becomes candidate of things they will be exploring in the next mission, We want to acknowledge users ideas and let them bring it along. I will give you details about user_observations when we start implementing the  component. 
  
  - hasIdea =="false" : ai response then should acknowledge their situation and encourage them to the urge journey.

**Step2**: pose the question that they are going to answer in the mission

If they have been wanting to start why havent they?: this is big question this mission tackles in a subtle way and across the mission thats what we want to show to the users. So step question sets up the investigation "why have they not started? is it lack of confidence, thinking they need lot of money, resources connections, they are sacred to put themselves out there" We dont need to ask anything here but acknowledge where they are now and ask them why havent they already started. We can use Ai to formulate a suitable way to setup this question taking into account why they are here? We will use all users input and AI response to contextualize this question framing. 



I have also attached earlier component SituationExplorer.tsx but i think we might have to modify it quite a bit. 

## m1-q1-setup

We just want to tell users how we all have different motivations, perceived fears/barriers and how they will be exploring that in this quest. So this is just next with a button to start the quest. We can have one common component for this

## m1-q1-barriers

I have implemented this earlier which i think we can use here

refer attached WhyHaventYouStarted.tsx



## m1-q1-motivation

refer attached MotivationExplorer.tsx



## m1-q1-future

attached -> components/program/mission1/FutureStateExplorer.tsx

## m1-q1-quit

attached -> QuitConditionExplorer.tsx

## m1-q1-reveal

attached -> CommitmentSynthesis.tsx

## m1-q1-action

attached -> MinimumCommitment.tsx



## About Observations

We are treating user_observations as key features throughout the app. User will save what they observed related to problems (which could become opportunities after assessment), they can save insights, market research, reflections, everything that they felt, observed and had a thought about.

- Flow : observations  -> assessment -> opportunities -> qualification and filtering -> project

- so we have domains which describe area observation belong to and could be 
  
  - problem: things that could become opoprtunities and evetually project that they will be working on. so for m1-setup  we want to save that in user_observations in problem domain and the other details under one of the focuses (refer src/lib/program/observationConfig.ts i have only added details for domain : problem)




