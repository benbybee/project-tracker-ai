import { createHash, randomBytes } from 'crypto';

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateKey(bytes = 32): { raw: string; hash: string } {
  const raw = randomBytes(bytes).toString('hex');
  return { raw, hash: hashKey(raw) };
}

const { raw, hash } = generateKey(32);

console.log('Integration key (store in IdeaForge backend env):');
console.log(raw);
console.log('\nSHA-256 hash (store in Project Tracker DB):');
console.log(hash);
console.log(
  '\nSQL template:\n' +
    "INSERT INTO integration_api_keys (id, user_id, name, integration, key_hash) VALUES (gen_random_uuid(), '<USER_ID>', 'IdeaForge', 'ideaforge', '<KEY_HASH>');"
);
