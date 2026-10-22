import React, { useState } from 'react';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';

interface ConversationalBarProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const EXAMPLE_FOLLOW_UPS = [
  "I'm looking for somewhere to go with my girlfriend",
  'Somewhere peaceful and not too crowded',
  'Keep it under ₹1,000 in the evening',
  'Actually, make it a family outing',
];

export const ConversationalBar: React.FC<ConversationalBarProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
          Conversational Refinement Engine
        </span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          (Progressively refines results while preserving existing context)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a refinement e.g., 'Somewhere quiet for a couple under ₹1,000 in evening'..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-sm transition shadow-md shadow-indigo-600/30"
        >
          <span>Refine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Suggested Follow-ups */}
      <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
        <span className="text-[11px] text-slate-400 mr-1">Quick examples:</span>
        {EXAMPLE_FOLLOW_UPS.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(ex)}
            className="text-[11px] text-slate-400 hover:text-indigo-300 bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 px-2 py-0.5 rounded-md transition"
          >
            "{ex}"
          </button>
        ))}
      </div>
    </div>
  );
};
