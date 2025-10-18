import Image from "next/image";

export default function Footer() {
  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 z-10"
      style={{ 
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Cursor Hackathon */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/70">
              Built for the
            </span>
            <Image 
              src="/cursor.svg" 
              alt="Cursor" 
              width={60} 
              height={12}
              className="opacity-80 hover:opacity-100 transition-opacity"
              style={{ filter: 'invert(1)' }}
            />
            <span className="text-xs text-white/70">
              Hackathon
            </span>
          </div>
          
          {/* Center: AI provider logos */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 group">
              <Image 
                src="/groq.svg" 
                alt="Groq" 
                width={50} 
                height={12}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ filter: 'invert(1)' }}
              />
            </div>
            <div className="flex items-center gap-1.5 group">
              <Image 
                src="/gemini.svg" 
                alt="Gemini" 
                width={20} 
                height={20}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
              Gemini
            </div>
            <div className="flex items-center gap-1.5 group">
              <Image 
                src="/openai.svg" 
                alt="OpenAI" 
                width={20} 
                height={20}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
              OpenAI
            </div>
            <div className="flex items-center gap-1.5 group">
              <Image 
                src="/supabase.svg" 
                alt="Supabase" 
                width={20} 
                height={20}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
              Supabase
            </div>
          </div>

          {/* Right: Built by credit */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/70">
              Built by{" "}
              <a 
                href="https://x.com/bchewyme" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white transition-colors underline"
              >
                @bchewyme
              </a>
              {" "}on 𝕏
            </div>
            <a
              href="https://github.com/bchewy/canyoubeatgroq"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="View source on GitHub"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="text-white"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

