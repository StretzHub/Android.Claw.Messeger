import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1024;
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT
  ?? 'Du bist ein hilfreicher persönlicher Assistent. Antworte präzise und freundlich.';

/**
 * Sendet den Gesprächsverlauf an Groq (Llama) und gibt die Antwort zurück.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
export async function askClaude(messages) {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
