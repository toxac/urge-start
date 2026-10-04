# Quest 2 notes

## m1-q2-setup
I think we need to add aa optional key of description in the node, this can be the text that we use for framing and leaving user with a question (sub question under mission nig question) and use our src/components/program/common/StandardSetupFrame.tsx to render the description from node. Right now we dont have anything where we can add text/description inside of node.

## m1-q2-inventory
Identify current resources and perceived constraints. 
same things which can be resources lack of it can be a constraint so i think it would be nice to sort of show them all things which go into building a business, money, time, knowhow, network, etc and user can rate them on a slider.
so if they go extreme right they percieve it as resource they have available and extereme right being a big constraint. we have to find good way to implement this in UI with clear annotations what every score means. What do you think?
- attached old component: ResourceInventory.tsx

## m1-q2-network
I envision this to be an interface where we can guide users in discovering their connections. They might just see it as followers on social accounts but we should broaden this to how many people in their phone contact, how many people in the communities they belong to both offline and online, we should save all of them with details as they will become interesting when users have to find people to reach out to when they are working on opportunities/project and later when they have something to sell. 
- attached old component - NetworkMapper.tsx
## m1-q2-capabilities
I am not really sure about this they way it is. I want this to be similar to how i have network component in mind as a discovery of capabilities. What can users do can they build something, can they communicate, can they analyze etc. Help me think throg this please. i dont want this to be like some reume builder. 
- attached old component - CapabilityInventory

## m1-q2-experience 
this is also same as above two where we want to see if users have had any experience which could be useful in the journey/starting/running a business. Selling, marketing, reviewing, interviews, and several others experiences which people dont think of as useful to business directly
- attached old component - ExperienceMiner
## m1-q2-reveal
We should anaylse and put together a comprehensive account of user resources, what they have, what they lack, hidden strenghts etc
## m1-q2-action
this is where we can create very focused tasks for them to fill the gaps, We can use AI to generate tasks in the user_task schema and show it users, User can select ones they want to work on. 