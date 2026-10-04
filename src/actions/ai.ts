'use server';

import { deepseek } from '@/lib/ai/deepseekClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AIRequestParams {
  systemPrompt: string;
  userPrompt: string;
  componentKey: string;
  sourceNodeKey: string;
  purpose: string;
  requireJson?: boolean;
  temperature?: number;
}

async function logAIInteraction(
  userId: string,
  params: AIRequestParams,
  model: string,
  responseContent: string | null,
  error: string | null = null
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from('ai_logs').insert({
    user_id: userId,
    source_node_key: params.sourceNodeKey,
    component_key: params.componentKey,
    purpose: params.purpose,
    provider: 'deepseek',
    model: model,
    request: { 
      systemPrompt: params.systemPrompt, 
      userPrompt: params.userPrompt,
      requireJson: params.requireJson 
    },
    response: responseContent ? { content: responseContent } : null,
    status: error ? 'error' : 'success',
    error: error
  });
}

/**
 * LIGHT WRAPPER
 * Best for: Fast extractions, simple reflections, JSON parsing, classification.
 * Default temp: 0.2 (deterministic).
 */
export async function invokeAILight(params: AIRequestParams) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const model = 'deepseek-chat';
  
  try {
    const response = await deepseek.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt }
      ],
      temperature: params.temperature ?? 0.2,
      response_format: params.requireJson ? { type: 'json_object' } : { type: 'text' }
    });

    const content = response.choices[0]?.message?.content || '';
    await logAIInteraction(user.id, params, model, content);
    
    return { success: true, content };
  } catch (error: any) {
    await logAIInteraction(user.id, params, model, null, error.message);
    return { success: false, error: 'AI request failed.' };
  }
}

/**
 * STANDARD WRAPPER
 * Best for: Deep synthesis, pattern recognition, heavy contextual reasoning.
 * Default temp: 0.7 (more creative/fluid).
 */
export async function invokeAIStandard(params: AIRequestParams) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const model = 'deepseek-chat'; // Could swap to 'deepseek-reasoner' if they expose it
  
  try {
    const response = await deepseek.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt }
      ],
      temperature: params.temperature ?? 0.7,
      response_format: params.requireJson ? { type: 'json_object' } : { type: 'text' }
    });

    const content = response.choices[0]?.message?.content || '';
    await logAIInteraction(user.id, params, model, content);
    
    return { success: true, content };
  } catch (error: any) {
    await logAIInteraction(user.id, params, model, null, error.message);
    return { success: false, error: 'AI request failed.' };
  }
}