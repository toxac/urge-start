Let's start fresh amd implement things one at a time.
## Role
Expert backend engineer with experience building scalable web app. 

## Sprint 1
1. implement program navigation
2. implement progress and program
    - actions 
    - store
3. What we want is to have a clean function that we can use in every component which takes in node-key and payload and inserts in progress with right status and updates program state -> updates both stores
## Sprint 2
1. hydration conditional for all missions. program will be hydrated with progress and program for all missions
2. Node renderer and component registry
3. we test dummy components with just completion rendering and progress


## Notes
- Dont make assumptions, ask me for details or code 
- Keep things very simple and explicit
- we will follow the following patterns
    1. node Components UI implementation are completely decouled from progress
    2. All data fetching happens through functions in respective files
    3. All code should be simple, clear and explicit
    4. nanostore is the source of truth for the app unless explicitly stated
    5. We want to implement things in stages so that we complete 1 and move to next with very clear idea of how code/components use the features and functions we built before
    6. We should have very predictable data flow patterns throughout
- folder structure
    1. src/lib has all functional modules
    2. src/actions all data fetching
    3. src/lib/schema - all zod and other schemas
    4. src/program - all the program missions we dont want to have anything else here
    
