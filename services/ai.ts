import { ForgeConfig, Idea, VerificationResult, Blueprint, Language, AISettings } from "../types";
import { PROMPT_LANG_MAP } from "../locales";

export class AIError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AIError';
    this.code = code;
  }
}

const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const buildAiConfig = (customConfig?: AISettings) => {
  const apiKey = customConfig?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIError("API key not found. Provide it in settings or `.env`.", "NO_API_KEY");
  }

  const baseUrl = (customConfig?.baseUrl || OPENAI_BASE_URL).replace(/\/+$/, '');
  const model = customConfig?.model || OPENAI_MODEL;

  return { apiKey, baseUrl, model };
};

const handleAIError = (error: any) => {
  console.error("AI API Error:", error);
  const msg = error?.message || String(error);
  if (msg.includes("429") || msg.includes("Too Many Requests")) {
    throw new AIError("High traffic. AI service is throttling requests. Try again shortly.", "RATE_LIMIT_429");
  }
  if (msg.includes("401") || msg.includes("API key")) {
    throw new AIError("Invalid API Key. Please check your settings.", "INVALID_KEY_401");
  }
  throw new AIError(msg, "UNKNOWN_ERROR");
};

const callChatCompletion = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiConfig?: AISettings,
  temperature = 0.7,
  max_tokens = 1200
) => {
  const { apiKey, baseUrl, model } = buildAiConfig(apiConfig);
  const url = `${baseUrl}/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new AIError(`AI request failed (${response.status}): ${payload}`, `HTTP_${response.status}`);
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) {
      throw new AIError("AI response is missing content.", "NO_CONTENT");
    }
    return text.trim();
  } catch (error) {
    if (error instanceof AIError) throw error;
    handleAIError(error);
  }
};

const tryJsonParse = <T>(payload: string): T | null => {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const findJsonBlock = (text: string): string | null => {
  const stack: string[] = [];
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{' || char === '[') {
      if (startIndex === -1) {
        startIndex = i;
      }
      stack.push(char);
      continue;
    }

    if (char === '}' || char === ']') {
      const last = stack[stack.length - 1];
      if (!last) {
        continue;
      }
      if ((last === '{' && char === '}') || (last === '[' && char === ']')) {
        stack.pop();
        if (stack.length === 0 && startIndex !== -1) {
          return text.slice(startIndex, i + 1);
        }
      }
    }
  }

  return null;
};

const extractFromCodeFence = (text: string): string | null => {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/i;
  const match = text.match(fenceRegex);
  if (!match) return null;
  return match[1].trim();
};

const parseJsonOrThrow = <T>(raw: string, context: string): T => {
  if (!raw) {
    throw new AIError(`AI response empty (${context}).`, "NO_CONTENT");
  }

  const direct = tryJsonParse<T>(raw.trim());
  if (direct !== null) return direct;

  const fencePayload = extractFromCodeFence(raw);
  if (fencePayload) {
    const parsedFence = tryJsonParse<T>(fencePayload);
    if (parsedFence !== null) return parsedFence;
  }

  const payload = findJsonBlock(raw);
  if (payload) {
    const parsed = tryJsonParse<T>(payload);
    if (parsed !== null) return parsed;
  }

  throw new AIError(`Failed to parse AI JSON response (${context}).`, "INVALID_JSON");
};

export const generateIdeas = async (config: ForgeConfig, lang: Language, apiConfig?: AISettings): Promise<Idea[]> => {
  const langName = PROMPT_LANG_MAP[lang];
  const prompt = config.mode === 'RANDOM'
    ? `Generate ${config.quantity} chaotic AI+ Web3 concepts for the Monad ecosystem only. Use wildly varying sectors but keep the ecosystem as Monad. Keep the tone punchy and the response in ${langName}.`
    : `Generate ${config.quantity} AI+ Web3 concepts targeting ecosystems: ${config.ecosystems.join(', ')} and sectors: ${config.sectors.join(', ')} with risk level ${config.degenLevel}. Additional context: ${config.userContext || 'None'}. Respond in ${langName}.`;

  const schemaInstructions = `Return a JSON array where each object includes title, tagline, description, ecosystem, sector, degenScore (0-100), and features (array of strings). No extra text outside the JSON.`;
  const messages = [
    { role: 'system', content: `You are a Monad-native AI+ creative director. Focus on content that can become a token narrative and can be handed off for a Nad.fun launch. ${schemaInstructions}` },
    { role: 'user', content: prompt }
  ];

  const rawResponse = await callChatCompletion(messages, apiConfig, 0.8, 1400);
  if (!rawResponse) return [];

  const rawIdeas = parseJsonOrThrow<any[]>(rawResponse, 'generateIdeas');
  if (!Array.isArray(rawIdeas)) {
    throw new AIError("AI returned an unexpected format (ideas array).", "INVALID_RESPONSE");
  }

  return rawIdeas.map(idea => ({
    id: crypto.randomUUID(),
    title: idea.title || 'Untitled Idea',
    tagline: idea.tagline || '',
    description: idea.description || '',
    ecosystem: idea.ecosystem || 'Unknown',
    sector: idea.sector || 'Unspecified',
    degenScore: typeof idea.degenScore === 'number' ? idea.degenScore : Number(idea.degenScore) || 50,
    features: Array.isArray(idea.features) ? idea.features : [],
    status: 'GENERATED',
    language: lang
  }));
};

export const verifyIdea = async (idea: Idea, lang: Language, apiConfig?: AISettings): Promise<VerificationResult> => {
  const langName = PROMPT_LANG_MAP[lang];
  const prompt = `Evaluate the uniqueness of this Web3 idea: Title: ${idea.title}, Description: ${idea.description}, Ecosystem: ${idea.ecosystem}. Return JSON with { isUnique: boolean, similarProjects: [ { name, url?, description? } ], notes: string, pivotSuggestion?: string }. Provide notes and pivotSuggestion in ${langName}.`;

  const messages = [
    { role: 'system', content: 'You are an analyst. Always respond with valid JSON.' },
    { role: 'user', content: prompt }
  ];

  const rawResponse = await callChatCompletion(messages, apiConfig, 0.2, 800);
  const parsed = parseJsonOrThrow<VerificationResult>(rawResponse, 'verifyIdea');
  return {
    isUnique: parsed.isUnique ?? true,
    similarProjects: parsed.similarProjects ?? [],
    notes: parsed.notes ?? '',
    pivotSuggestion: parsed.pivotSuggestion
  };
};

const serializeBlueprintField = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map(item => serializeBlueprintField(item)).filter(Boolean).join('; ');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, child]) => `${key}: ${serializeBlueprintField(child)}`)
      .join('; ');
  }
  return String(value);
};

export const generateBlueprint = async (idea: Idea, lang: Language, apiConfig?: AISettings): Promise<Blueprint> => {
  const langName = PROMPT_LANG_MAP[lang];
  const prompt = `Craft a technical blueprint for ${idea.title} (Sector: ${idea.sector}, Chain: ${idea.ecosystem}). Include Executive Summary, Tokenomics, Roadmap (4 phases), and Technical Architecture. Return JSON with { overview, tokenomics, roadmap, technicalArchitecture } where each field is expressed as a natural language paragraph or sentences (no nested JSON structures) in ${langName}.`;

  const messages = [
    { role: 'system', content: 'Respond only with JSON describing blueprint sections.' },
    { role: 'user', content: prompt }
  ];

  const rawResponse = await callChatCompletion(messages, apiConfig, 0.3, 1200);
  const parsed = parseJsonOrThrow<Blueprint>(rawResponse, 'generateBlueprint');
  return {
    overview: serializeBlueprintField(parsed.overview),
    tokenomics: serializeBlueprintField(parsed.tokenomics),
    roadmap: serializeBlueprintField(parsed.roadmap),
    technicalArchitecture: serializeBlueprintField(parsed.technicalArchitecture),
    contractCode: parsed.contractCode ? serializeBlueprintField(parsed.contractCode) : undefined,
    frontendSnippet: parsed.frontendSnippet ? serializeBlueprintField(parsed.frontendSnippet) : undefined,
    deploymentUrl: serializeBlueprintField(parsed.deploymentUrl)
  };
};

export const translateIdea = async (idea: Idea, targetLang: Language, apiConfig?: AISettings): Promise<Idea> => {
  const langName = PROMPT_LANG_MAP[targetLang];
  const prompt = `Translate this Web3 idea into ${langName}, keeping tone and technical detail. Input: Title: ${idea.title}, Tagline: ${idea.tagline}, Description: ${idea.description}, Features: ${idea.features.join(', ')}. Return JSON with title, tagline, description, features (array).`;

  const messages = [
    { role: 'system', content: 'Return valid JSON with the translated fields.' },
    { role: 'user', content: prompt }
  ];

  const rawResponse = await callChatCompletion(messages, apiConfig, 0.6, 800);
  const translated = parseJsonOrThrow<any>(rawResponse, 'translateIdea');
  return {
    ...idea,
    title: translated.title || idea.title,
    tagline: translated.tagline || idea.tagline,
    description: translated.description || idea.description,
    features: Array.isArray(translated.features) ? translated.features : idea.features,
    language: targetLang
  };
};

export const generateContractCode = async (idea: Idea, apiConfig?: AISettings): Promise<string> => {
  const prompt = `Write a Solidity smart contract skeleton for ${idea.title}. Use ${idea.ecosystem} context. Return only the code block.`;
  const messages = [
    { role: 'system', content: 'Respond with code only.' },
    { role: 'user', content: prompt }
  ];

  return callChatCompletion(messages, apiConfig, 0.2, 400);
};

export const generateFrontendPrompt = async (idea: Idea, contractCode: string, apiConfig?: AISettings): Promise<string> => {
  const prompt = `You are a vibe-coding agent. Write a complete frontend Dapp build prompt for ${idea.title} on ${idea.ecosystem}.
The goal: build a production-ready frontend that integrates with the contract below.
Include: target framework, required pages, wallet connection, contract interface and ABI hints, read/write flows, state management, error states, and UI requirements.
Return a single, well-structured prompt that a coding agent can follow end-to-end. Contract code:
${contractCode}`;
  const messages = [
    { role: 'system', content: 'Respond only with the final build prompt.' },
    { role: 'user', content: prompt }
  ];

  return callChatCompletion(messages, apiConfig, 0.4, 900);
};
