import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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
};

function getModelConfigs(): ModelConfig[] {
  return [
    {
      name: "llama-3.3-70b",
      provider: "Groq",
      client: groqClient,
      modelId: "llama-3.3-70b-versatile",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "llama-3.1-8b",
      provider: "Groq",
      client: groqClient,
      modelId: "llama-3.1-8b-instant",
      enabled: !!process.env.GROQ_API_KEY,
    },
    {
      name: "gpt-4o",
      provider: "OpenAI",
      client: openaiClient,
      modelId: "gpt-4o",
      enabled: !!process.env.OPENAI_API_KEY,
    },
    {
      name: "gemini-2.5-flash",
      provider: "Google",
      client: geminiClient,
      modelId: "gemini-2.0-flash-exp",
      enabled: !!process.env.GEMINI_API_KEY,
    },
  ];
}

async function raceModel(word: string, config: ModelConfig) {
  const t0 = Date.now();
  try {
    const model = config.client(config.modelId);
    await generateText({
      model,
      prompt: `Type this word: ${word}`,
      maxOutputTokens: 16,
    });
    const timeMs = Date.now() - t0;
    return {
      model: config.name,
      provider: config.provider,
      timeMs,
    };
  } catch (err) {
    console.error(`[${config.name}] Error:`, err);
    // Return a fallback time if API fails
    return {
      model: config.name,
      provider: config.provider,
      timeMs: 1500,
    };
  }
}

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Invalid word" }, { status: 400 });
    }

    const configs = getModelConfigs().filter((c) => c.enabled);

    // Race all models in parallel
    const results = await Promise.all(configs.map((config) => raceModel(word, config)));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Typeracer race error:", error);
    return NextResponse.json({ error: "Failed to race" }, { status: 500 });
  }
}

