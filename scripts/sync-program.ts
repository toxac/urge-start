// scripts/sync-program.ts
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/database.types';
import { buildProgramNodeRows } from '../src/lib/program/sync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseSecretKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY');
}

const supabase = createClient<Database>(
  supabaseUrl,
  supabaseSecretKey,
);

async function main() {
  const rows = buildProgramNodeRows();

  console.log('Clearing existing program_nodes...');
  const { error: deleteError } = await supabase
    .from('program_nodes')
    .delete()
    .gte('sequence', 0);

  if (deleteError) {
    throw new Error(`Failed to clear program nodes: ${deleteError.message}`);
  }

  console.log(`Syncing ${rows.length} program nodes...`);
  const { error: insertError } = await supabase
    .from('program_nodes')
    .upsert(rows, {
      onConflict: 'node_key',
    });

  if (insertError) {
    throw new Error(`Failed to sync program nodes: ${insertError.message}`);
  }

  console.log(`Successfully synced ${rows.length} nodes to program_nodes.`);
}

main().catch((error) => {
  console.error('Program sync failed.');
  console.error(error);
  process.exit(1);
});