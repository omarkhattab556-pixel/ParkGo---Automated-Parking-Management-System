import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI } from '../../config/constants.js';
import { buildSystemPrompt } from './chatbot.knowledge.js';
import { toolDeclarations, runTool } from './chatbot.tools.js';

const MAX_TOOL_STEPS = 5; // safety cap on the function-calling loop
const MAX_HISTORY = 20; // trailing turns kept from the client history

let genAI = null;
const getClient = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(GEMINI.API_KEY);
  return genAI;
};

/**
 * Normalise stored history into Gemini `Content[]`.
 * Accepts DB rows ({ role, content }) or plain turns ({ role, text }).
 * The current user message is passed separately (not in history).
 *
 * Gemini requires the history to start with a 'user' turn, so any leading
 * assistant rows are dropped.
 */
export const toGeminiHistory = (history = []) => {
  const mapped = (Array.isArray(history) ? history : [])
    .map((m) => ({ role: m?.role, text: m?.content ?? m?.text }))
    .filter((m) => typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

  const firstUser = mapped.findIndex((m) => m.role === 'user');
  return firstUser === -1 ? [] : mapped.slice(firstUser);
};

/**
 * Run one chat turn.
 *
 * @param {object}   opts
 * @param {{id:number, email:string, user_type:string, first_name?:string}} opts.user
 * @param {Array}    opts.history  prior turns from the client
 * @param {string}   opts.message  the new user message
 * @returns {Promise<{ reply: string, actionSuggestion: object|null }>}
 */
export const runChat = async ({ user, history, message }) => {
  const client = getClient();

  const declarations = toolDeclarations(user.user_type);
  const model = client.getGenerativeModel({
    model: GEMINI.MODEL,
    systemInstruction:
      buildSystemPrompt(user.user_type, { firstName: user.first_name }) +
      `\n\nCURRENT DATE/TIME (server): ${new Date().toISOString()}`,
    tools: declarations.length ? [{ functionDeclarations: declarations }] : undefined,
  });

  const chat = model.startChat({ history: toGeminiHistory(history) });

  let actionSuggestion = null;
  let result = await chat.sendMessage(message);

  // Function-calling loop: keep answering functionCalls until the model
  // produces a plain text reply (or we hit the safety cap).
  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const calls = result.response.functionCalls?.() || [];
    if (!calls.length) break;

    const responses = [];
    for (const call of calls) {
      let output;
      try {
        output = await runTool(call.name, call.args, user);
      } catch (err) {
        output = { error: err.message || 'Tool execution failed' };
      }
      // A propose* tool carries a structured action for the frontend to render.
      if (output && output.__action) {
        actionSuggestion = output.__action;
      }
      responses.push({
        functionResponse: { name: call.name, response: { result: output } },
      });
    }

    result = await chat.sendMessage(responses);
  }

  let reply = '';
  try {
    reply = result.response.text();
  } catch {
    reply = '';
  }
  if (!reply) {
    reply = actionSuggestion
      ? 'Ready when you are — press the button to confirm.'
      : "Sorry, I couldn't produce a response. Please try rephrasing.";
  }

  return { reply, actionSuggestion };
};

export default runChat;
