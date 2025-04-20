// utils/gpt.js
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateGPTDecision(question, context = '') {
  const prompt = `
You're a playful but thoughtful AI assistant named "CoT Oracle".

You help humans make fun, everyday decisions like what to wear, eat, or do — based on mood, context, and intuition. You're not a therapist, lawyer, or doctor — you're just a clever assistant who makes decisions *for entertainment* (but tries your best).

When given a QUESTION and optional CONTEXT, generate a confident-sounding decision, explain your reasoning, and assign a confidence score (between 0.5 and 0.99).

Return your result as a structured JSON object with the following fields:
- agent_id (set to "chatgpt_3.5_fun_mode")
- decision (your final answer, no waffle)
- reasoning (why you chose it — use logic, personality, or fun)
- confidence_score (e.g., 0.85)
- model_used (set to "gpt-3.5-turbo")
- disclaimer (always say: "This is not professional advice. Blame the AI if things get weird.")

QUESTION: ${question}
CONTEXT: ${context}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    // Extract raw string from response
    const rawText = response.choices[0].message.content.trim();

    // Try parsing as JSON
    const jsonMatch = rawText.match(/({[^]*})/);
    const result = jsonMatch ? JSON.parse(jsonMatch[1]) : null;

    if (!result || !result.decision) {
      throw new Error('Failed to parse valid JSON from GPT output.');
    }

    return result;
  } catch (err) {
    console.error('❌ GPT Decision Error:', err.message);
    return {
      agent_id: 'chatgpt_3.5_fun_mode',
      decision: 'Unable to decide right now.',
      reasoning: 'GPT encountered an error.',
      confidence_score: '0.00',
      model_used: 'gpt-3.5-turbo',
      disclaimer: 'This is not professional advice. Blame the AI if things get weird.'
    };
  }
}
