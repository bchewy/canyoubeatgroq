import Image from "next/image";
import geminiSvg from "@/app/gemini.svg";
import openaiSvg from "@/app/openai.svg";
import groqWebp from "../public/groq.webp";

type ModelIconProps = {
  provider?: string;
  modelName?: string;
  className?: string;
};

function inferProvider(modelName: string): string | null {
  const lower = modelName.toLowerCase();
  
  // Check for explicit provider prefix first
  if (lower.startsWith("google/")) return "Google";
  if (lower.startsWith("openai/")) return "OpenAI";
  if (lower.startsWith("groq/")) return "Groq";
  
  // Fallback to pattern matching (for legacy data without prefixes)
  if (lower.startsWith("gemini")) return "Google";
  if (lower.startsWith("gpt")) return "OpenAI";
  if (lower.includes("llama") || lower.includes("compound")) return "Groq";
  
  return null;
}

export default function ModelIcon({ provider, modelName, className = "w-4 h-4" }: ModelIconProps) {
  const effectiveProvider = provider || (modelName ? inferProvider(modelName) : null);
  
  if (!effectiveProvider) return null;

  let icon = null;
  let alt = "";

  switch (effectiveProvider) {
    case "Google":
      icon = geminiSvg;
      alt = "Gemini";
      break;
    case "OpenAI":
      icon = openaiSvg;
      alt = "OpenAI";
      break;
    case "Groq":
      icon = groqWebp;
      alt = "Groq";
      break;
    default:
      return null;
  }

  return <Image src={icon} alt={alt} className={className} />;
}

