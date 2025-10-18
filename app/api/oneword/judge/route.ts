import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AiAnswer = {
  model: string;
  answer: string;
};

export async function POST(req: Request) {
  try {
    const { question, userAnswer, aiAnswers, expectedAnswer } = (await req.json()) as {
      question: string;
      userAnswer: string;
      aiAnswers: AiAnswer[];
      expectedAnswer: string;
    };

    console.log(`[judge] Received request with ${aiAnswers?.length || 0} AI answers`);
    if (aiAnswers) {
      console.log(`[judge] AI models: ${aiAnswers.map(a => a.model).join(', ')}`);
    }

    if (!question || !userAnswer || !aiAnswers || !expectedAnswer) {
      console.error("[judge] Missing params:", { 
        hasQuestion: !!question, 
        hasUserAnswer: !!userAnswer, 
        hasAiAnswers: !!aiAnswers,
        aiAnswersCount: aiAnswers?.length,
        hasExpectedAnswer: !!expectedAnswer 
      });
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    // Format all answers for judging
    const answersText = [
      `User: "${userAnswer}"`,
      ...aiAnswers.map((ai) => `${ai.model}: "${ai.answer}"`),
    ].join("\n");

    // Use groq/compound to judge with reasoning
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "groq/compound",
        messages: [
          {
            role: "system",
            content: `You are a trivia judge. You must evaluate whether each answer is correct or acceptable for the given question. The expected answer is provided as a reference, but accept synonyms, alternate forms, or reasonable variations. Be fair and lenient with minor differences (e.g., singular vs plural, abbreviations). Think step-by-step about each answer.`,
          },
          {
            role: "user",
            content: `Question: "${question}"
Expected Answer: "${expectedAnswer}"

Answers to judge:
${answersText}

Please reason through whether each answer is correct or acceptable. Then provide your final judgment in JSON format:
{
  "reasoning": "your step-by-step reasoning here",
  "userCorrect": true/false,
  "aiCorrect": [
    {"model": "model-name", "correct": true/false},
    ...
  ]
}`,
          },
        ],
        temperature: 0.2,
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[judge] API error: ${response.status} ${errorText}`);
      return NextResponse.json({ error: "ai_error" }, { status: 503 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("[judge] Raw response:", content);

    // Try to extract JSON from the response
    let judgment;
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgment = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[judge] Failed to parse response:", content);
      // Fallback: simple string matching
      const normalizedUser = userAnswer.toLowerCase().trim();
      const normalizedExpected = expectedAnswer.toLowerCase().trim();
      const userCorrect = normalizedUser === normalizedExpected;
      
      judgment = {
        reasoning: "Unable to parse detailed reasoning. Using simple string matching.",
        userCorrect,
        aiCorrect: aiAnswers.map((ai) => ({
          model: ai.model,
          correct: ai.answer.toLowerCase().trim() === normalizedExpected,
        })),
      };
    }

    // Create a set of valid model names from the original aiAnswers
    const validModelNames = new Set(aiAnswers.map((ai) => ai.model));
    
    // Filter out any model names from judge that weren't in the original list
    const filteredAiCorrect = judgment.aiCorrect.filter((ai: { model: string }) => 
      validModelNames.has(ai.model)
    );
    
    console.log("[judge] Valid models:", Array.from(validModelNames));
    console.log("[judge] Judge returned models:", judgment.aiCorrect.map((ai: { model: string }) => ai.model));
    console.log("[judge] Filtered to:", filteredAiCorrect.map((ai: { model: string }) => ai.model));

    // Determine winner
    const userCorrect = judgment.userCorrect;
    const anyAiCorrect = filteredAiCorrect.some((ai: { correct: boolean }) => ai.correct);
    
    let winner: 'user' | 'ai' | 'tie';
    if (userCorrect && !anyAiCorrect) {
      winner = 'user';
    } else if (!userCorrect && anyAiCorrect) {
      winner = 'ai';
    } else {
      winner = 'tie';
    }

    return NextResponse.json({
      reasoning: judgment.reasoning,
      userCorrect: judgment.userCorrect,
      aiResults: filteredAiCorrect.map((ai: { model: string; correct: boolean }) => ({
        model: ai.model,
        answer: aiAnswers.find((a) => a.model === ai.model)?.answer || "",
        correct: ai.correct,
      })),
      winner,
    });
  } catch (error) {
    console.error("[judge] Error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

