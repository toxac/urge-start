# Mission 4 inserted experiments ids


```json
[
    {"id":"22b0a1e6-0b44-4018-9bbb-c9b2ea2ed9e4","key":"new_channel_offer_drop","mission_key":"mission-4","name":"New Channel Offer Test"},
    {"id":"25f36b45-3b5a-4081-953d-f4108fa07fb7","key":"delivery_cost_dry_run","mission_key":"mission-4","category":"build","involves_people":false,"name":"1-Order Delivery & Cost Dry Run"},
    {"id":"aeb38646-0600-43ad-9377-b928fe43f755","key":"priced_offer_outreach","mission_key":"mission-4","category":"traction","involves_people":true,"name":"Direct Priced Offer Check",}
    ]

```

# Mission 5 Experiment Id
```json
[
    {"id":"7c45d84e-c117-4d56-ba00-dd759625291f","key":"alpha_delivery_test","mission_key":"mission-5","category":"build","involves_people":true,"name":"Founding Alpha Delivery Test"}]
```

## Mission 5 
Compared to the previous mission this is not going to be sequential. This is how i am thinking we should implement it

- quest 1 : 
    1. setup
    2. build dashboard 
        - we will have a dedicated page for build with widgets for   marketing and sales, product, other admin such as paymemts, purchases
        - tracking for costs, time etc. 
        - when user are done here they can press the button build complete ready to test. this will handle progress and take users to next quest
- quest 2: Alpha test (experiment) 
- quest 3: launch


I like the overall approach. tell me if i am thinking about it correctly or in right direction based on your suggestions and some of my additions. This is how I see building block of the ops page/mission.
- ops dashboard: baseline and where user is based on their goals strategic monthly/quarterly goals
    - weekly data ingest component
- Analysis components
    - Anaylse patterns wrt users context and identify gaps
- Preset action components: we will create several components/widgets with specific usecases and preset prompt and skills and pass the recent context to it.
    - planning components: market planning (customer acquisition, campaigns etc), optimization planning, goal settings, positioning, pricing,offers
    - action components: to show users tangible tasks thats we can save in users_tasks.
    - we want to have planning-action components working together. In case, users wants to find out out to do next, it will reach response from planning components.
    - We will have to figure out where we save data from planner and actions, we can have a general project_ops table to store both actions and plans.
    - We want to structtue this really well by functional units and we dont need to address every part of business as they are jhust startin now. 
        1. market (planner and actions)- suggested campaigns, communication, offers/discounts and target 
        2. money (planner and actions): minimize costs, look at oportunities to increase revenue
        3. customer (planner and actions) - loyalty, customer relations, issues etc

Summary:
We can have following key components
- dashboard/kpi/baseline
- analysis
- planners
- actions