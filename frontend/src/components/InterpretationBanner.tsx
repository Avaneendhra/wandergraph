import React from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { InterpretedCriteria } from '../types';

interface InterpretationBannerProps {
  criteria: InterpretedCriteria | null | undefined;
  onDismiss: () => void;
}

export const InterpretationBanner: React.FC<InterpretationBannerProps> = ({
  criteria,
  onDismiss,
}) => {
  if (!criteria || (!criteria.explanation_banner && !criteria.was_corrected)) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto my-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/30 shadow-lg backdrop-blur-md transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-indigo-300">Intelligent Search Interpretation</span>
              {criteria.was_corrected && (
                <span className="text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Spelling & Locality Corrected
                </span>
              )}
            </div>

            <p className="text-slate-200 mt-1 leading-relaxed">
              {criteria.explanation_banner || (
                <span>
                  Query analyzed: {criteria.detected_category && <b>{criteria.detected_category} </b>}
                  {criteria.detected_locality && <span>in <b>{criteria.detected_locality}</b> </span>}
                  {criteria.detected_city && <span>({criteria.detected_city})</span>}
                </span>
              )}
            </p>

            {criteria.was_corrected && criteria.original_query && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                <span>Original:</span>
                <span className="italic text-slate-400 line-through">{criteria.original_query}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-emerald-400 font-medium">{criteria.corrected_query || criteria.original_query}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="Dismiss interpretation banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
