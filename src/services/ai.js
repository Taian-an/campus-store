// Generates an SEO-friendly product description (proposal §8). Falls back to
// a deterministic local template when no AI_API_KEY is configured, so
// product CRUD works end-to-end in dev without burning API credits — the
// real key is wired in via Key Vault per the Wk5 milestone.
async function generateDescription({ name, category, notes }) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return `${name} — a must-have pick for campus life. ${notes ? notes + ' ' : ''}Durable, practical, and ready to ship from the CampusStore catalog.`;
  }

  const provider = process.env.AI_PROVIDER || 'openai';
  if (provider !== 'openai') {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Write a short SEO-friendly product description (max 40 words) for a university merchandise store item named "${name}"${notes ? `, staff notes: ${notes}` : ''}.`,
        },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) throw new Error(`AI provider error: ${response.status}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content?.trim() || null;
}

module.exports = { generateDescription };
