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

  const { error } = await supabase
    .from('program_nodes')
    .upsert(rows, {
      onConflict: 'node_key',
    });

  if (error) {
    throw new Error(`Failed to sync program nodes: ${error.message}`);
  }

  console.log(`Synced ${rows.length} program nodes.`);
}

main().catch((error) => {
  console.error('Program sync failed.');
  console.error(error);
  process.exit(1);
});