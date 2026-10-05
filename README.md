# Testing Mission 1

## Mission Main Page - Setup Node

Right now when we go to mission page "/program/mission/mission-1". We see mission setup node. Which is logically correct but does not feel right. Here is what i think how we should think about the mission entry with setup.

1. Users should feel they are starting a new mission. In case of mission 1 they should get the feeling that they are starting a new journey. In many ways a new beginning. We don't get mission title and overall idea about the mission. It has to be both compelling in sense of word as well as graphically. 

2. We need a distinct mission start experience. We can brainstorm what this could be. I had also originally planned to have a video for every mission setting what users will do in video and audio format.

3. This same idea should be carried over in the nodes as well. We need to have distinct UI treatment for  setup, investigation, reveal, action nodes so users can register what they about to do. 

4. Having the Key guide on top in mission nodes takes away from the setup. remeber we are trying to setup the entire mission here with situation and a question/complication. We are missing the drama here. I have attached screenshot of the page. Let's think what would work the best, forget our mission and setup for a bit and just think about it independently. How would we do it if we were doing just that with any constraints of program, data, layout. 

5. Context Rail: i dont see anything in context rail. 

browser console log
```bash
forward-logs-shared.ts:120 [HMR] connected
react-dom-client.development.js:1649 Allow attribute will take precedence over 'allowfullscreen'.
setValueForAttribute @ react-dom-client.development.js:1649
forward-logs-shared.ts:120 [Fast Refresh] rebuilding
forward-logs-shared.ts:120 [Fast Refresh] done in 222ms
forward-logs-shared.ts:120 [Fast Refresh] rebuilding
forward-logs-shared.ts:120 ambientTracks Array(1)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
forward-logs-shared.ts:120 ambientTracks Array(1)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
forward-logs-shared.ts:120 [Fast Refresh] done in 694ms
forward-logs-shared.ts:120 [Fast Refresh] rebuilding
installHook.js:1 Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior
overrideMethod @ installHook.js:1
forward-logs-shared.ts:120 [Fast Refresh] done in 3589ms
forward-logs-shared.ts:120 [Fast Refresh] rebuilding
forward-logs-shared.ts:120 [Fast Refresh] done in 197ms
forward-logs-shared.ts:120 [Fast Refresh] rebuilding
forward-logs-shared.ts:120 [Fast Refresh] done in 109ms
forward-logs-shared.ts:120 ambientTracks Array(1)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
forward-logs-shared.ts:120 ambientTracks Array(1)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
forward-logs-shared.ts:120 ambientTracks Array(1)0: {id: 'f82230ec-a02e-4cef-8b3a-6b903321e937', node_key: 'm1-setup', title: 'Slow down. Start here.', url: 'https://open.spotify.com/embed/track/<ID>', role: 'ambient', …}length: 1[[Prototype]]: Array(0)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
forward-logs-shared.ts:120 ambientTracks Array(1)
forward-logs-shared.ts:120 supplementaryLinks Array(0)
<ID>:1  Failed to load resource: the server responded with a status of 404 ()

```

## SituationExplorer
I tried the following as my input to the question. (I have had ideas to start something of my own. I have noticed several things around me that to me seem like very good business idea. I want to build something in food sector. I have been thinking about this for a lognt ime and when i came acrodd urge i felt like this was the right time to start.)

- Correctly identified this as not having an idea but when i look at the question I dont think users are going to write about the idea. 
- I think we should ask the question and based on the response from ai hasIdea. 
- If hasIdea == true then we show them a button to add the idea in a dialog for observation they had we will work on that from next mission.
- If hasIdea == false : still we ask them if they had any business idea
- also I dont like the sentence "Why haven't you started yet?". We should rather say that we will discover together in this mission what has kept yuou from starting?
- I would also keep main button to navigate to next on the right. 

