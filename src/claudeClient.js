import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT
  ?? 'Du bist ein hilfreicher persönlicher Assistent. Antworte präzise und freundlich.';

/**
 * Sendet den Gesprächsverlauf an Claude und gibt die Antwort zurück.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
export async function askClaude(messages) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return text;
}
