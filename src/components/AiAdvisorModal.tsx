import React, { useState } from 'react';
import { X, Sparkles, Send, BrainCircuit, Lightbulb, Film } from 'lucide-react';

interface AiAdvisorModalProps {
  onClose: () => void;
  onRequestAnime: (title: string) => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  onClose,
  onRequestAnime,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const samplePrompts = [
    'Recommend a dark psychological anime with deep plot twists',
    'What should I watch next if I love high-octane mecha & cyberpunk?',
    'Explain the chronological watch order for complex multi-season series',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || prompt).trim();
    if (!q) return;

    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.recommendation) {
        setAnswer(data.recommendation);
      } else {
        setAnswer('Unable to generate recommendation at this moment.');
      }
    } catch (err: any) {
      setAnswer('AI query error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/8 bg-[#141A23] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Anime Curator & Advisor</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  High Thinking Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini with deep reasoning across themes, storylines, and catalog curation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Quick prompt suggestions */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Try asking:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(s);
                    handleAsk(s);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#141A23] hover:bg-[#1E2634] text-xs text-slate-300 border border-white/5 hover:border-white/15 transition-all text-left cursor-pointer"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask for recommendations, storyline analysis, or hidden gems..."
              className="flex-grow bg-[#141A23] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#E50914] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </div>

          {/* Response Box */}
          {loading && (
            <div className="p-6 rounded-xl bg-[#141A23] border border-white/8 text-center space-y-3">
              <BrainCircuit className="w-8 h-8 text-amber-400 animate-pulse mx-auto" />
              <p className="text-xs font-medium text-slate-300">
                Reasoning deeply with Gemini High Thinking mode...
              </p>
            </div>
          )}

          {answer && !loading && (
            <div className="p-5 rounded-xl bg-[#141A23] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Curator Recommendation</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
