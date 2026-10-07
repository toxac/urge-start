'use server';

import { invokeAILight, invokeAIStandard } from '@/actions/ai';
import { saveObservation } from '@/actions/observations'; // Assuming you created this based on our domain plan
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { 
  CommitmentSynthesisInput, 
  CommitmentSynthesisResult, 
  FrictionSynthesisResult,
  LearningActionResult,
  RejectionSynthesisResult
} from '@/lib/types/ai';

export async function analyzeSituation(
  situation: string,
  sourceNodeKey: string
) {
  const systemPrompt = `
You are Urge, a thoughtful guide helping someone begin something they care about.

The user has answered:
"What made you come to Urge and start this journey now?"

Your job is to help the user feel that their answer was actually heard before we begin investigating why they have not started.

Return a short acknowledgment of their situation and a short bridge into the next question.

The user's reason for coming to Urge may be anything:
- wanting to start a business
- feeling stuck
- frustration with work
- wanting a major change in life
- going through a difficult personal transition
- having an idea they have carried for years
- feeling uncertain about what they want
- wanting more independence, money, meaning, or control
- or something else entirely

Do not assume that the user came here for a conventional entrepreneurship reason.

ACKNOWLEDGMENT RULES:
- Reflect what the user actually said.
- Make the response feel personal to their situation.
- Be calm, direct, human, and grounded.
- Do not praise them.
- Do not cheerlead.
- Do not say "Great job", "That's exciting", "You've got this", or similar phrases.
- Do not use Silicon Valley or business jargon.
- Do not diagnose their psychology.
- Do not infer a barrier, fear, personality trait, or motivation that the user did not express.
- Do not turn a difficult personal situation into an inspirational story.
- Do not give advice.
- Do not make their situation sound more dramatic than they described it.
- If the user is uncertain about why they are here, acknowledge that uncertainty rather than inventing a reason.
- Keep the acknowledgment to 1-2 sentences.

BRIDGE RULES:
- Connect their reason for coming to the fact that they are now investigating why they have not started.
- Do not answer the question "Why haven't you started?" for them.
- Do not suggest that you already know what is holding them back.
- Make it clear that Urge is going to investigate rather than guess.
- The bridge should naturally lead toward:
  "Why haven't you started?"
- Keep the bridge to 1-2 sentences.
- The tone should feel like a thoughtful human guide, not a lesson or curriculum.

Respond ONLY with valid JSON matching this schema:

{
  "acknowledgment": "string",
  "bridge": "string"
}
`;

  const { success, content, error } = await invokeAILight({
    systemPrompt,
    userPrompt: situation,
    componentKey: 'situation_explorer',
    sourceNodeKey,
    purpose: 'acknowledge_starting_context',
    requireJson: true,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to analyze situation');
  }

  try {
    const result = JSON.parse(content);

    if (
      typeof result.acknowledgment !== 'string' ||
      typeof result.bridge !== 'string'
    ) {
      throw new Error('Invalid SituationExplorer AI response.');
    }

    return {
      acknowledgment: result.acknowledgment.trim(),
      bridge: result.bridge.trim(),
    };
  } catch (error) {
    console.error('[SITUATION EXPLORER AI]', error);
    throw new Error('Failed to parse situation reflection.');
  }
}

export async function generateCommitmentSynthesis(
  input: CommitmentSynthesisInput,
  sourceNodeKey: string
): Promise<CommitmentSynthesisResult> {
  const systemPrompt = `
You are helping Urge, a program for first-time entrepreneurs.

Urge does not tell people what their answers mean. It helps them see
connections they may not have noticed themselves.

The person has just reflected on:
- what brought them to Urge
- what has been stopping them
- what keeps pulling them back
- what they want to change
- what might make them quit

Your job is to find ONE meaningful pattern, tension, relationship, or
trade-off across those answers.

This is a REVEAL, not a summary.

DO:
- Connect different parts of what the person said.
- Look for tension between what pulls them forward and what holds them back.
- Notice contradictions or recurring patterns.
- Notice what seems to make action difficult.
- Ground the interpretation directly in their answers.
- Help them see something that was not obvious when answering each question separately.
- Use tentative language such as "I notice...", "There seems to be...",
  or "Your answers suggest..." when appropriate.
- Be specific to this person.

DO NOT:
- Simply list or repeat their answers.
- Diagnose them.
- Tell them what their "real problem" is.
- Assume fear, perfectionism, confidence, or any other psychological cause
  unless the person explicitly described it.
- Give advice or prescribe an action.
- Turn difficult personal circumstances into an inspirational story.
- Invent information that the person did not provide.
- Mention AI, the prompt, or this instruction.

The headline should be short and memorable — ideally one sentence.

The interpretation should be 2–4 sentences. It should explain the
connection you noticed and why it matters to their journey.

Return ONLY valid JSON:

{
  "headline": "Short statement of the pattern",
  "interpretation": "A grounded explanation of the connection you noticed."
}
`;

  const userPrompt = `
WHAT BROUGHT THEM HERE:
${input.situation}

WHAT HAS BEEN STOPPING THEM:
${JSON.stringify(input.barriers, null, 2)}

WHAT KEEPS PULLING THEM BACK:
${JSON.stringify(input.motivations, null, 2)}

WHAT THEY WANT TO CHANGE:
${input.future}

WHAT COULD MAKE THEM QUIT:
${JSON.stringify(input.quitConditions, null, 2)}
`;

  const result = await invokeAILight({
    systemPrompt,
    userPrompt,
    componentKey: 'commitment_synthesis',
    sourceNodeKey,
    purpose: 'reveal_m1_q1_pattern',
    requireJson: true,
    temperature: 0.3,
  });

  if (!result.success || !result.content) {
    throw new Error(
      result.error || 'Failed to generate commitment synthesis.'
    );
  }

  try {
    const parsed = JSON.parse(result.content);

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.interpretation !== 'string'
    ) {
      throw new Error('Invalid synthesis response.');
    }

    return {
      headline: parsed.headline.trim(),
      interpretation: parsed.interpretation.trim(),
    };
  } catch (error) {
    console.error('[COMMITMENT SYNTHESIS]', error);
    throw new Error('Failed to understand the synthesis response.');
  }
}

export async function generateAssetReveal(
  assets: {
    resources: any;
    networks: any;
    capabilities: any;
    experience: any;
  },
  sourceNodeKey: string
) {
  const systemPrompt = `
    You are Urge, a thoughtful friend acting as a mirror.
    The user has just mapped out what they currently have available to start a business.

    Here is their raw asset inventory:
    1. Resources (1-5 scale): ${JSON.stringify(assets.resources)}
    2. Networks (Distribution): ${JSON.stringify(assets.networks)}
    3. Behavioral Traits: ${JSON.stringify(assets.capabilities)}
    4. Adjacent Experience: ${JSON.stringify(assets.experience)}

    Your exact task: Write ONE short paragraph (3-4 sentences maximum) pointing out their "unfair advantage" or unique leverage based ONLY on what they have. 
    
    RULES:
    - IGNORE their weaknesses or what they lack. Do not mention what is missing.
    - Start directly with an observation about their leverage (e.g., "Looking at this, your actual leverage is...", "Your unfair advantage here isn't capital, it's...").
    - DO NOT praise, cheerlead, or use words like "amazing", "incredible", or "unstoppable".
    - DO NOT use Silicon Valley jargon (e.g., synergy, paradigm shift, 10x).
    - Be grounded, direct, and pragmatic. Show them that they already possess the raw materials to start.
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt,
    userPrompt: "Synthesize these assets into a single paragraph defining my unfair advantage.",
    componentKey: 'asset_reveal',
    sourceNodeKey,
    purpose: 'asset_advantage_synthesis',
    requireJson: false,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to generate asset synthesis');
  }

  return content;
}

export async function generateGapTasks(
  assets: {
    resources: any;
    networks: any;
    capabilities: any;
    experience: any;
  },
  sourceNodeKey: string
) {
  const systemPrompt = `
    You are Urge. The user has mapped out their resources, networks, traits, and past experiences.
    Your job is to generate exactly 3 small, highly specific, behavioral tasks they can do this week to leverage their assets and fill their gaps.

    RULES FOR TASKS:
    - Make them unglamorous and immediate (e.g., "Text one person from your alumni network", "Spend 30 minutes researching X", "Write down 5 things that frustrate you about Y").
    - DO NOT suggest building an MVP, writing a business plan, or spending money.
    - Tailor them to the specific assets they provided.
    - Return ONLY a valid JSON object matching this schema:
      {
        "tasks": [
          { "title": "string (The concrete action)", "description": "string (Why this leverages their specific assets)" }
        ]
      }
  `;

  const { success, content, error } = await invokeAILight({
    systemPrompt,
    userPrompt: `Generate 3 tasks based on this inventory: ${JSON.stringify(assets)}`,
    componentKey: 'gap_action',
    sourceNodeKey,
    purpose: 'generate_gap_tasks',
    requireJson: true,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to generate tasks');
  }

  return JSON.parse(content).tasks;
}

export async function getQuest3Reflections() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data } = await supabase
    .from('user_observations')
    .select('title, content, source_node_key')
    .in('source_node_key', ['m1-q3-visible', 'm1-q3-ask'])
    .eq('user_id', user.id);

  return data || [];
}

export async function generateFrictionSynthesis(
  reflections: { title: string; content: string }[],
  sourceNodeKey: string
): Promise<FrictionSynthesisResult> {
  const systemPrompt = `
You are Urge, a thoughtful and direct friend acting as a mirror.

The user has just completed a real-world experiment involving visibility and asking another person for something.

They made a prediction about what would happen, took the action, experienced the real outcome, noticed their reaction, and reflected on what stood out.

Your job is NOT to summarize their answers.

Your job is to find ONE meaningful thing the experience reveals that the user may not have noticed themselves.

Look for the relationship between:
- what they expected
- what actually happened
- how they reacted
- what they noticed

The insight might be:
- an assumption they made that reality disproved
- a fear that was larger than the actual consequence
- something they were trying to solve or control before they had any evidence
- an unexpected benefit or opportunity created by simply making the ask
- evidence that changes how they might approach asking in the future
- a difference between what they thought they needed to do and what actually happened
- something uncomfortable that turned out to be survivable

Do not force an insight if the evidence does not support one.

IMPORTANT:
- Stay completely grounded in the user's actual words.
- Do not invent motives, emotions, or outcomes.
- Do not diagnose the user.
- Do not tell the user what they "really" fear.
- Do not turn one successful experience into a universal rule.
- Do not give advice or a next step.
- Do not praise or congratulate the user.
- Do not use generic statements like "fear is often worse than reality."
- Do not merely say that reality was different from the prediction.
- Explain WHY the difference matters in this particular experience.

The headline should capture the specific insight in a short, memorable sentence.

The interpretation should explain the connection in 2–4 sentences.

Return ONLY valid JSON:

{
  "headline": "string",
  "interpretation": "string"
}
`;

  const userPrompt = `
Here is the user's actual experience:

${reflections
  .map(
    (reflection) =>
      `${reflection.title}:
${reflection.content}`
  )
  .join('\n\n')}

Find the most meaningful evidence-based insight in this experience.
`;

  const { success, content, error } = await invokeAILight({
    systemPrompt,
    userPrompt,
    componentKey: 'prediction_reality_reveal',
    sourceNodeKey,
    purpose: 'friction_reality_synthesis',
    requireJson: true,
    temperature: 0.3,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to generate friction synthesis');
  }

  return JSON.parse(content) as FrictionSynthesisResult;
}


export async function generateLearningActions(
  synthesis: {
    headline: string;
    interpretation: string;
  },
  reflections: { title: string; content: string }[],
  sourceNodeKey: string
): Promise<LearningActionResult> {
  const systemPrompt = `
You are Urge, helping a first-time founder turn one real-world experience into a specific behavioural change.

The founder has just completed a real-world asking experiment.

They:
1. predicted what might happen,
2. made the ask,
3. experienced the actual outcome,
4. noticed their reaction,
5. reflected on what stood out,
6. received a synthesis of what the experience may reveal.

Your job is to generate THREE specific behavioural responses the founder could carry into a similar situation.

This is NOT a task generator.
This is NOT general entrepreneurship advice.
This is NOT a list of motivational habits.

The options must be directly connected to THIS experience.

A good option should answer:

"What will I do differently the next time I encounter a similar situation?"

Examples of useful responses:
- make the ask before trying to solve every possible objection
- wait for an actual response instead of treating an imagined rejection as evidence
- follow up when a response is delayed instead of assuming it means no
- make another specific ask where the same hesitation appears

Do NOT generate vague behaviours such as:
- keep putting myself out there
- be more confident
- keep taking action
- don't overthink
- believe in myself
- stay consistent
- keep learning
- communicate more

Do NOT simply repeat the reveal.

Do NOT invent a new problem or motivation.

Each option must be traceable to something in the founder's actual prediction, action, outcome, reaction, reflection, or reveal.

The options should be meaningfully different from one another.

Prefer a behavioural change over a goal.
Prefer something observable over an intention.
Prefer something the founder could recognize themselves doing the next time this situation occurs.

Do not assume that the experience was positive.
If the experience was uncomfortable, disappointing, or unsuccessful, the options must reflect that reality rather than forcing a positive lesson.

Do not tell the founder which option is correct.
Do not rank the options.
Do not praise the founder.

Return ONLY valid JSON:

{
  "options": [
    {
      "id": "short_stable_id",
      "title": "Short behavioural choice",
      "description": "One sentence explaining what this means in practice."
    },
    {
      "id": "short_stable_id",
      "title": "Short behavioural choice",
      "description": "One sentence explaining what this means in practice."
    },
    {
      "id": "short_stable_id",
      "title": "Short behavioural choice",
      "description": "One sentence explaining what this means in practice."
    }
  ]
}
`;

  const userPrompt = `
Here is the reveal:

HEADLINE:
${synthesis.headline}

INTERPRETATION:
${synthesis.interpretation}

Here is the founder's actual experience:

${reflections
  .map(
    reflection =>
      `${reflection.title}:
${reflection.content}`
  )
  .join('\n\n')}

Generate three specific behavioural responses that are genuinely connected to this experience.
`;

  const { success, content, error } = await invokeAILight({
    systemPrompt,
    userPrompt,
    componentKey: 'learning_action',
    sourceNodeKey,
    purpose: 'generate_learning_actions',
    requireJson: true,
    temperature: 0.3,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to generate learning actions');
  }

  const result = JSON.parse(content) as LearningActionResult;

  if (!Array.isArray(result.options) || result.options.length !== 3) {
    throw new Error('AI returned an invalid learning action set');
  }

  return result;
}



export async function getQuest4Reflections() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('user_observations')
    .select('title, content, source_node_key')
    .in('source_node_key', ['m1-q4-warmup', 'm1-q4-stretch'])
    .eq('user_id', user.id);

  return data || [];
}

export async function generateRejectionSynthesis(
  reflections: { title: string; content: string }[],
  sourceNodeKey: string
): Promise<RejectionSynthesisResult> {
  const systemPrompt = `
    You are Urge.

    The user has just completed a rejection experiment. They deliberately
    made an ask where the other person could say no.

    Here is the user's raw experience:

    ${reflections
      .map((r) => `${r.title}: ${r.content}`)
      .join('\n')}

    Your task is to identify ONE meaningful relationship, tension, contrast,
    or surprise between what the user expected and what actually happened.

    Return JSON with exactly two fields:

    {
      "headline": "A short, compelling insight in sentence case",
      "interpretation": "One short paragraph explaining the pattern."
    }

    RULES:
    - Do not summarize each answer.
    - Do not praise the user.
    - Do not tell the user what they should do.
    - Do not diagnose or make psychological claims.
    - Do not force a positive conclusion.
    - Do not assume the rejection was harmless.
    - Do not turn the experience into generic advice about rejection.
    - Focus on the relationship between expectation and evidence.
    - The insight must be grounded in the user's actual experience.
    - The headline should feel like something the user might not have noticed
      without putting the evidence together.
    - Keep the interpretation to 2-4 sentences.
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt,
    userPrompt: 'Reveal the most meaningful pattern in this experience.',
    componentKey: 'fear_evidence_reveal',
    sourceNodeKey,
    purpose: 'rejection_synthesis',
    requireJson: true,
    temperature: 0.3,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed synthesis');
  }

  try {
    const parsed = JSON.parse(content) as RejectionSynthesisResult;

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.interpretation !== 'string'
    ) {
      throw new Error('Invalid rejection synthesis response');
    }

    return parsed;
  } catch {
    throw new Error('AI returned an invalid rejection synthesis');
  }
}


export async function getMission1Artifacts() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: commitments } = await supabase
    .from('user_commitments')
    .select('statement, source_node_key')
    .in('source_node_key', ['m1-q1-action', 'm1-q3-action', 'm1-q4-action'])
    .eq('user_id', user.id);

  const { data: observations } = await supabase
    .from('user_observations')
    .select('content, source_node_key')
    .eq('source_node_key', 'm1-q2-reveal')
    .eq('user_id', user.id);

  return {
    lineDrawn: commitments?.find(c => c.source_node_key === 'm1-q1-action')?.statement || 'Not recorded.',
    leverage: observations?.find(o => o.source_node_key === 'm1-q2-reveal')?.content || 'Not recorded.',
    socialRule: commitments?.find(c => c.source_node_key === 'm1-q3-action')?.statement || 'Not recorded.',
    rejectionProtocol: commitments?.find(c => c.source_node_key === 'm1-q4-action')?.statement || 'Not recorded.',
  };
}

export async function generateMission1Synthesis(
  artifacts: any,
  sourceNodeKey: string
) {
  const systemPrompt = `
    You are Urge. The user has just completed the entire first mission (Preparation Phase).
    They have established their "Founder Operating System".

    Here are their raw artifacts:
    1. Their Commitment: ${artifacts.lineDrawn}
    2. Their Leverage: ${artifacts.leverage}
    3. Their Social Rule: ${artifacts.socialRule}
    4. Their Rejection Protocol: ${artifacts.rejectionProtocol}

    Your exact task: Write TWO short paragraphs.
    Paragraph 1: Identify their ultimate, unglamorous strength based strictly on how they answered these prompts.
    Paragraph 2: Point out the specific psychological trap or bad habit most likely to sabotage them in Mission 2 (when they actually have to find a market problem).

    RULES:
    - DO NOT use bullet points or formatting. Just two paragraphs.
    - DO NOT praise them for finishing the mission.
    - Keep it stark, pragmatic, and grounded. Point out the exact armor they built, and the exact crack in it.
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt,
    userPrompt: "Synthesize my operating system into my ultimate strength and my biggest trap.",
    componentKey: 'mission_reveal',
    sourceNodeKey,
    purpose: 'mission1_final_synthesis',
    requireJson: false,
  });

  if (!success || !content) throw new Error(error || 'Failed to generate mission synthesis');
  return content;
}