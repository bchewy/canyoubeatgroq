import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ModelConfig = {
  name: string;
  provider: string;
  modelId: string;
};

function getGroqModels(): ModelConfig[] {
  return [
    { name: "llama-3.1-8b", provider: "Groq", modelId: "llama-3.1-8b-instant" },
    { name: "llama-3.3-70b", provider: "Groq", modelId: "llama-3.3-70b-versatile" },
    { name: "compound", provider: "Groq", modelId: "groq/compound" },
    { name: "compound-mini", provider: "Groq", modelId: "groq/compound-mini" },
  ];
}

async function solveWithModel(
  question: string,
  config: ModelConfig
): Promise<{ model: string; provider: string; answer: string; timeMs: number }> {
  const t0 = Date.now();
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          {
            role: "system",
            content: "You are answering a trivia question. Respond with ONLY ONE WORD. No explanation, no punctuation, just the single word answer.",
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.3,
        max_completion_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const timeMs = Date.now() - t0;
    
    // Extract first word only
    const answer = text.trim().split(/\s+/)[0] || "";
    
    console.log(`[${config.name}] Raw response: "${text}" -> Extracted: "${answer}"`);
    
    return { model: config.name, provider: config.provider, answer, timeMs };
  } catch (error) {
    console.error(`[${config.name}] Error:`, error);
    const timeMs = Date.now() - t0;
    return { model: config.name, provider: config.provider, answer: "", timeMs };
  }
}

export async function POST(req: Request) {
  try {
    const { question } = (await req.json()) as { question: string };
    if (!question || !question.trim()) {
      return NextResponse.json({ error: "missing_question" }, { status: 400 });
    }

    const models = getGroqModels();
    const results = await Promise.all(models.map((config) => solveWithModel(question, config)));

    // Filter out empty answers
    const validResults = results.filter((r) => r.answer && r.answer.trim().length > 0);
    
    console.log(`[ai-solve] Total models: ${results.length}, Valid answers: ${validResults.length}`);

    return NextResponse.json({ results: validResults });
  } catch (error) {
    console.error("[ai-solve] Error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

