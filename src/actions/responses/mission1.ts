'use server';

import { invokeAILight, invokeAIStandard } from '@/actions/ai';
import { saveObservation } from '@/actions/observations'; // Assuming you created this based on our domain plan
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function analyzeSituation(situation: string, sourceNodeKey: string) {
  const systemPrompt = `
    You are Urge, a thoughtful friend helping someone start a business.
    The user is answering the question: "Where are you right now?" regarding their desire to start something.
    
    Your task:
    1. Determine if they explicitly mentioned a specific business idea or project they want to work on.
    2. Extract that idea clearly and concisely (if present).
    3. Write a short, 1-2 sentence acknowledgment of their situation. 
    
    RULES FOR ACKNOWLEDGMENT:
    - Use a calm, direct, human tone.
    - DO NOT praise them, act like a cheerleader, or say "Great job!" or "That's awesome!"
    - DO NOT use Silicon Valley jargon (e.g., leverage, unlock, scale, disrupt).
    - Just reflect back what they said in a grounded way. E.g., "It sounds like you've been carrying this bakery idea for a while." or "Okay. You know you want to work for yourself, even if you don't have the exact idea yet."

    Respond ONLY with a valid JSON object matching this schema:
    {
      "hasIdea": boolean,
      "extractedIdea": string | null,
      "acknowledgment": string
    }
  `;

  const { success, content, error } = await invokeAILight({
    systemPrompt,
    userPrompt: situation,
    componentKey: 'situation_explorer',
    sourceNodeKey,
    purpose: 'extract_starting_situation',
    requireJson: true,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to analyze situation');
  }

  const result = JSON.parse(content);

  // If the AI detected a concrete idea, save it silently as an observation
  if (result.hasIdea && result.extractedIdea) {
    await saveObservation({
      title: 'Initial Idea',
      content: result.extractedIdea,
      domain: 'problem',
      focus: 'personal', // Defaulting to personal focus for initial ideas
      source_node_key: sourceNodeKey,
    });
  }

  return {
    acknowledgment: result.acknowledgment,
    hasIdea: result.hasIdea,
  };
}

export async function generateQuadrantSynthesis(
  quadrants: {
    motivation: string;
    barrier: string;
    future: string;
    quit: string;
  },
  sourceNodeKey: string
) {
  const systemPrompt = `
    You are Urge, a thoughtful friend acting strictly as a mirror.
    The user has just mapped out their internal state regarding starting a business.

    Here are their raw answers:
    1. The Pull (Motivation): ${quadrants.motivation}
    2. The Hold (Barrier): ${quadrants.barrier}
    3. The Stakes (Future): ${quadrants.future}
    4. The Boundary (Quit Condition): ${quadrants.quit}

    Your exact task: Write ONE short paragraph (3-4 sentences maximum) pointing out a tension, pattern, or interesting reality between these specific answers.

    RULES:
    - Start directly with an observation (e.g., "It is interesting that...", "There is a tension here between...", "One thing I notice is...").
    - DO NOT praise, cheerlead, or say "Great job", "That makes sense", or "You've got this."
    - DO NOT give advice or tell them what to do next.
    - DO NOT use Silicon Valley jargon.
    - Keep it grounded, direct, and slightly uncomfortable if there is an obvious contradiction (e.g., wanting total autonomy but being paralyzed by what others think).
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt,
    userPrompt: "Synthesize these four quadrants into a single observation.",
    componentKey: 'commitment_synthesis',
    sourceNodeKey,
    purpose: 'quadrant_mirror_synthesis',
    requireJson: false,
  });

  if (!success || !content) {
    throw new Error(error || 'Failed to generate synthesis');
  }

  return content;
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
) {
  const systemPrompt = `
    You are Urge, a thoughtful friend acting as a mirror.
    The user just completed two uncomfortable social tasks: making themselves visible on social media, and asking a stranger for a micro-commitment.
    
    Here are their raw reflections on how it felt:
    ${reflections.map(r => `${r.title}:${r.content}`).join('\n')}

    Your exact task: Write ONE short paragraph (3-4 sentences maximum) pointing out the gap between the anxiety they predicted and the reality they experienced.

    RULES:
    - Start directly with an observation about their relationship to social friction.
    - DO NOT praise them or say "Great job putting yourself out there."
    - Be grounded and direct. Highlight the illusion of fear if they realized it wasn't that bad, or acknowledge the sting if it was uncomfortable but survivable.
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt,
    userPrompt: "Synthesize these reflections on social friction.",
    componentKey: 'prediction_reality_reveal',
    sourceNodeKey,
    purpose: 'friction_reality_synthesis',
    requireJson: false,
  });

  if (!success || !content) throw new Error(error || 'Failed to generate synthesis');
  return content;
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
) {
  const systemPrompt = `
    You are Urge. The user just completed 'Rejection Therapy'—intentionally getting rejected in both low and high-stakes scenarios.
    
    Here is their raw data on how getting rejected felt:
    ${reflections.map(r => `${r.title}:${r.content}`).join('\n')}

    Your exact task: Write ONE short paragraph (3-4 sentences maximum) pointing out that rejection is survivable and just a data point.

    RULES:
    - Point out that the "no" didn't kill them.
    - DO NOT praise them. Keep it pragmatic.
    - Emphasize that 'no' is just a mechanical boundary, not a reflection of their worth.
  `;

  const { success, content, error } = await invokeAIStandard({
    systemPrompt, userPrompt: "Synthesize these rejection reflections.",
    componentKey: 'fear_evidence_reveal', sourceNodeKey, purpose: 'rejection_synthesis', requireJson: false,
  });

  if (!success || !content) throw new Error(error || 'Failed synthesis');
  return content;
}