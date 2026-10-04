'use server';

import { invokeAILight } from '@/actions/ai';
import { saveObservation } from '@/actions/observations'; // Assuming you created this based on our domain plan

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