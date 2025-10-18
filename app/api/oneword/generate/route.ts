import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic } = (await req.json()) as { topic: string };
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "missing_topic" }, { status: 400 });
    }

    // Use groq/compound-mini to generate question
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        messages: [
          {
            role: "system",
            content: "You are a trivia question generator. Generate interesting trivia questions with clear one-word answers.",
          },
          {
            role: "user",
            content: `Generate a trivia question about "${topic}" that has a clear one-word answer. The question should be interesting and specific. Return ONLY valid JSON in this exact format: {"question": "...", "expectedAnswer": "..."}`,
          },
        ],
        temperature: 0.8,
        max_completion_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate] API error: ${response.status} ${errorText}`);
      return NextResponse.json({ error: "ai_error" }, { status: 503 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      if (!parsed.question || !parsed.expectedAnswer) {
        throw new Error("Invalid response format");
      }
      
      return NextResponse.json({
        question: parsed.question,
        expectedAnswer: parsed.expectedAnswer,
      });
    } catch (parseError) {
      console.error("[generate] Failed to parse AI response:", content);
      return NextResponse.json({ error: "invalid_ai_response" }, { status: 500 });
    }
  } catch (error) {
    console.error("[generate] Error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

