/*
 Example: Call OpenAI from Node.js (CommonJS)

 Usage:
 1. Set your API key:
    export OPENAI_API_KEY="sk-..."
 2. Run:
    node examples/openai_example.js

 Notes:
 - Replace the `model` variable below with a model you have access to (e.g., a code model or chat model).
 - This example uses the installed `openai` package.
*/

const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not set. Set it with `export OPENAI_API_KEY="sk-..."`.');
    process.exit(1);
  }

  // Change this to a model you prefer
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const prompt = `Write a JavaScript function that checks whether a number is prime. Add brief comments and keep it concise.`;

  try {
    // Chat-style completion example
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes concise code.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const message = response.choices?.[0]?.message?.content ?? JSON.stringify(response, null, 2);
    console.log('Model response:\n');
    console.log(message);
  } catch (err) {
    console.error('OpenAI request failed:', err);
    process.exit(1);
  }
}

main();
