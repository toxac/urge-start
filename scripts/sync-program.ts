
// scripts/sync-program.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/database.types';
import { buildProgramNodeRows } from '../src/lib/program/sync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY environment variable.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function main() {
  const rows = buildProgramNodeRows();

  console.log(`Syncing ${rows.length} program nodes...`);

  const { error } = await supabase
    .from('program_nodes')
    .upsert(rows, { onConflict: 'node_key' });

  if (error) {
    throw new Error(`Failed to sync program nodes: ${error.message}`);
  }

  console.log(`Synced ${rows.length} program nodes.`);
}

main().catch((error: unknown) => {
  console.error(
    'Program node sync failed:',
    error instanceof Error ? error.message : error,
  );

  process.exit(1);
});
