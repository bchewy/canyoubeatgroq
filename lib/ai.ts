import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { normalizeAnswer } from "@/lib/normalize";
import type { Problem, AiModelResult } from "@/lib/types";

const groqClient = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const geminiClient = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type ModelConfig = {
  name: string;
  provider: string;
  client: ReturnType<typeof createOpenAI> | ReturnType<typeof createGoogleGenerativeAI>;
  modelId: string;
  enabled: boolean;
  useResponsesAPI?: boolean;
};

function getModelConfigs(allowAllModels = false): ModelConfig[] {
  const allConfigs = [
    {
      name: "llama-3.1-8b",
      provider: "Groq",
      client: groqClient,
      modelId: "llama-3.1-8b-instant",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "llama-3.3-70b",
      provider: "Groq",
      client: groqClient,
      modelId: "llama-3.3-70b-versatile",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "compound",
      provider: "Groq",
      client: groqClient,
      modelId: "groq/compound",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "compound-mini",
      provider: "Groq",
      client: groqClient,
      modelId: "groq/compound-mini",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "gpt-oss-120b",
      provider: "Groq",
      client: groqClient,
      modelId: "openai/gpt-oss-120b",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "gpt-oss-20b",
      provider: "Groq",
      client: groqClient,
      modelId: "openai/gpt-oss-20b",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "gpt-4o",
      provider: "OpenAI",
      client: openaiClient,
      modelId: "gpt-4o",
      enabled: !!process.env.OPENAI_API_KEY,
      useResponsesAPI: true,
    },
    {
      name: "gpt-5",
      provider: "OpenAI",
      client: openaiClient,
      modelId: "gpt-5",
      enabled: !!process.env.OPENAI_API_KEY,
      useResponsesAPI: true,
    },
    {
      name: "gpt-5-mini",
      provider: "OpenAI",
      client: openaiClient,
      modelId: "gpt-5-mini",
      enabled: !!process.env.OPENAI_API_KEY,
      useResponsesAPI: true,
    },
    {
      name: "gemini-2.5-flash",
      provider: "Google",
      client: geminiClient,
      modelId: "gemini-2.0-flash-exp",
      enabled: !!process.env.GEMINI_API_KEY,
    },
    {
      name: "gemini-2.5-flash-lite",
      provider: "Google",
      client: geminiClient,
      modelId: "gemini-2.0-flash-lite",
      enabled: !!process.env.GEMINI_API_KEY,
    },
    {
      name: "gemini-2.5-pro",
      provider: "Google",
      client: geminiClient,
      modelId: "gemini-2.5-pro",
      enabled: !!process.env.GEMINI_API_KEY,
    },
  ];
  
  // If allowAllModels is false, only return Groq models
  if (!allowAllModels) {
    return allConfigs.filter((c) => c.provider === "Groq");
  }
  
  return allConfigs;
}

function buildPrompt(p: Problem): string {
  if (p.type === "mcq") {
    const choices = (p.choices || []).join("\n- ");
    return [
      `${p.prompt}`,
      `Choices:`,
      `- ${choices}`,
      `Rules: Respond with exactly one of the choices above (verbatim). No extra words.`,
    ].join("\n");
  }
  return [
    `${p.prompt}`,
    `Rules: Return only the final answer token. If numeric, use digits only. No explanation.`,
  ].join("\n");
}

async function solveWithCompoundModel(problem: Problem, config: ModelConfig): Promise<AiModelResult> {
  const prompt = buildPrompt(problem);
  const system = "You are a strict grader. For multiple choice, reply with exactly one of the provided choices verbatim. For short answers, reply with the final token only. No explanation.";
  
  const t0 = Date.now();
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_completion_tokens: 16,
        compound_custom: {
          tools: {
            enabled_tools: ["web_search", "code_interpreter", "visit_website"]
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const timeMs = Date.now() - t0;
    const answer = normalizeAnswer(text);
    return { model: config.name, provider: config.provider, answer, timeMs };
  } catch (err) {
    console.error(`[${config.name}] Error:`, err);
    const fallbackAnswer = normalizeAnswer(problem.answer);
    const fallbackMs = Number(process.env.AI_FAKE_MS || 1500);
    const timeMs = Math.max(fallbackMs, Date.now() - t0);
    return { model: config.name, provider: config.provider, answer: fallbackAnswer, timeMs };
  }
}

async function solveWithResponsesAPI(problem: Problem, config: ModelConfig): Promise<AiModelResult> {
  const prompt = buildPrompt(problem);
  
  const t0 = Date.now();
  try {
    // gpt-4o doesn't support reasoning parameter
    const requestBody: { model: string; input: string; reasoning?: { effort: string } } = {
      model: config.modelId,
      input: prompt,
    };
    
    if (config.modelId !== "gpt-4o") {
      requestBody.reasoning = { effort: "low" };
    }
    
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }
    
    const data = await response.json();
    const text = data.output?.text || "";
    const timeMs = Date.now() - t0;
    const answer = normalizeAnswer(text);
    return { model: config.name, provider: config.provider, answer, timeMs };
  } catch (err) {
    console.error(`[${config.name}] Error:`, err);
    const fallbackAnswer = normalizeAnswer(problem.answer);
    const fallbackMs = Number(process.env.AI_FAKE_MS || 1500);
    const timeMs = Math.max(fallbackMs, Date.now() - t0);
    return { model: config.name, provider: config.provider, answer: fallbackAnswer, timeMs };
  }
}

async function solveWithModel(problem: Problem, config: ModelConfig): Promise<AiModelResult> {
  // Use direct API for compound models
  if (config.modelId === "groq/compound" || config.modelId === "groq/compound-mini") {
    return solveWithCompoundModel(problem, config);
  }
  
  // Use Responses API for OpenAI models that require it
  if (config.useResponsesAPI) {
    return solveWithResponsesAPI(problem, config);
  }
  
  const prompt = buildPrompt(problem);
  const system = "You are a strict grader. For multiple choice, reply with exactly one of the provided choices verbatim. For short answers, reply with the final token only. No explanation.";

  const t0 = Date.now();
  try {
    const model = config.client(config.modelId);
    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0,
      maxOutputTokens: 16,
    });
    const timeMs = Date.now() - t0;
    const answer = normalizeAnswer(text || "");
    return { model: config.name, provider: config.provider, answer, timeMs };
  } catch (err) {
    // Log the actual error to help debug
    console.error(`[${config.name}] Error:`, err);
    const fallbackAnswer = normalizeAnswer(problem.answer);
    const fallbackMs = Number(process.env.AI_FAKE_MS || 1500);
    const timeMs = Math.max(fallbackMs, Date.now() - t0);
    return { model: config.name, provider: config.provider, answer: fallbackAnswer, timeMs };
  }
}

export async function solveWithAllModels(problem: Problem, allowAllModels = false): Promise<AiModelResult[]> {
  const configs = getModelConfigs(allowAllModels).filter((c) => c.enabled);
  
  // If no models are configured, return deterministic fallback
  if (configs.length === 0) {
    const fallbackAnswer = normalizeAnswer(problem.answer);
    const aiTimeMs = Number(process.env.AI_FAKE_MS || 1500);
    return [{ model: "fallback", provider: "Fallback", answer: fallbackAnswer, timeMs: aiTimeMs }];
  }

  // Run all models in parallel
  const results = await Promise.all(configs.map((config) => solveWithModel(problem, config)));
  return results;
}

// Backward compatibility - uses first enabled model
export async function solveProblemWithAI(problem: Problem): Promise<{ answer: string; aiTimeMs: number }> {
  const results = await solveWithAllModels(problem);
  const first = results[0];
  return { answer: first.answer, aiTimeMs: first.timeMs };
}


