import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Clock,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Compass,
  Star,
  Info,
} from 'lucide-react';
import { ItineraryResponse } from '../types';
import { sendItineraryMessage, replaceItineraryStop, resetItinerary } from '../services/api';

interface ItineraryChatbotProps {
  sessionId: string;
  cityName: string;
  cityId: string;
  onExploreInGraph?: (placeId: string) => void;
  onViewPlaceDetails?: (placeId: string) => void;
}

export const ItineraryChatbot: React.FC<ItineraryChatbotProps> = ({
  sessionId,
  cityName,
  cityId,
  onExploreInGraph,
  onViewPlaceDetails,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI Itinerary Assistant for ${cityName}. Tell me what you'd like to experience (e.g., "Full-day romantic highlights", "Budget trip under ₹1,000", or "Morning cafes and walking spots")!`,
    },
  ]);

  const [expandedStopIndex, setExpandedStopIndex] = useState<number | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, itinerary, isOpen]);

  // Suggested starters per city
  const isJpy = cityId.toLowerCase() === 'tokyo' || cityId.toLowerCase() === 'kyoto';
  const starters = isJpy
    ? [
        '🎒 Full-day temples & historic walks',
        '💑 Romantic evening in Gion',
        '🏷️ Budget discovery under ¥3,000',
        '☕ Morning cafes & parks',
      ]
    : [
        '🎒 Full-day landmarks & culture tour',
        '💑 Romantic date spots & dinner',
        '🏷️ Budget discovery under ₹1,000',
        '☕ Morning cafes & parks',
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await sendItineraryMessage(sessionId, userMsg, cityId);
      setItinerary(response);
      const assistantText =
        response.conversation_history.length > 0
          ? response.conversation_history[response.conversation_history.length - 1].content
          : `Here is your customized itinerary for ${cityName}:`;
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I ran into an issue: ${err.message || 'Could not plan itinerary.'}. Please try again!`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceStop = async (stopIndex: number, replacementPlaceId?: string, note?: string) => {
    setReplacingIndex(stopIndex);
    try {
      const updated = await replaceItineraryStop(sessionId, stopIndex, replacementPlaceId, note);
      setItinerary(updated);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Swapped Stop #${stopIndex + 1} with ${updated.stops[stopIndex].place.name}!`,
        },
      ]);
    } catch (err: any) {
      alert(`Could not swap stop: ${err.message || 'No alternative available.'}`);
    } finally {
      setReplacingIndex(null);
    }
  };

  const handleReset = async () => {
    try {
      await resetItinerary(sessionId);
      setItinerary(null);
      setMessages([
        {
          role: 'assistant',
          content: `Itinerary reset! What kind of plan would you like to build for ${cityName}?`,
        },
      ]);
    } catch (err) {
      console.warn('Error resetting itinerary:', err);
    }
  };

  return (
    <>
      {/* 1. Floating Circular Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30 group"
          aria-label="Open AI Itinerary Planner"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </div>
          <span className="hidden sm:inline tracking-wide">AI Itinerary Planner</span>
        </button>
      )}

      {/* 2. Slide-over / Modal Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 w-[96vw] sm:w-[460px] max-h-[85vh] h-[650px] bg-slate-950/95 border border-indigo-500/30 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  WanderGraph Itinerary AI
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-normal">
                    {cityName}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Sequenced plans grounded with real places</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Reset Itinerary Conversation"
                aria-label="Reset Itinerary"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close Itinerary Chat"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Quick Starters if no itinerary generated yet */}
            {!itinerary && messages.length <= 2 && (
              <div className="pt-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Try asking:
                </span>
                <div className="flex flex-col gap-1.5">
                  {starters.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(starter)}
                      className="text-left px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-800/80 hover:border-indigo-500/30 text-slate-300 hover:text-white text-xs transition"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Structured Itinerary Display */}
            {itinerary && (
              <div className="mt-3 space-y-3 pt-2 border-t border-slate-800/80">
                {/* Summary Banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{itinerary.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                      {itinerary.total_estimated_spend}
                    </span>
                  </div>

                  <p className="text-[11px] text-indigo-300/90 mt-1 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{itinerary.travel_feasibility_note}</span>
                  </p>
                </div>

                {/* Timeline Stops */}
                <div className="space-y-2.5">
                  {itinerary.stops.map((stop, sIndex) => {
                    const isExpanded = expandedStopIndex === sIndex;
                    const isReplacingThis = replacingIndex === sIndex;

                    return (
                      <div
                        key={stop.stop_index}
                        className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition overflow-hidden"
                      >
                        {/* Stop Header Row */}
                        <div
                          className="p-3 flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedStopIndex(isExpanded ? null : sIndex)}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Stop Number Circle */}
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {sIndex + 1}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                                  {stop.time_slot}
                                </span>
                                {stop.place.rating && (
                                  <div className="flex items-center text-[10px] text-amber-400 font-bold">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                                    <span>{stop.place.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                              <h5 className="font-bold text-white text-xs line-clamp-1 mt-0.5">
                                {stop.place.name}
                              </h5>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">
                              {stop.estimated_cost}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Details & Stop Replacement Actions */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/60 bg-slate-950/40 text-[11px] space-y-2">
                            <p className="text-slate-300 italic">{stop.visit_purpose}</p>

                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{stop.opening_hours_note}</span>
                            </div>

                            {stop.place.formatted_address && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="line-clamp-1">{stop.place.formatted_address}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              {onExploreInGraph && (
                                <button
                                  onClick={() => onExploreInGraph(stop.place.id)}
                                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 text-[10px] transition"
                                >
                                  Explore in Graph
                                </button>
                              )}
                              {onViewPlaceDetails && (
                                <button
                                  onClick={() => onViewPlaceDetails(stop.place.id)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                                >
                                  View Details
                                </button>
                              )}
                            </div>

                            {/* Swap Options / Alternative Candidates */}
                            <div className="pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                                Swap with alternative stop:
                              </span>

                              <div className="flex flex-wrap gap-1.5">
                                {stop.replacement_options && stop.replacement_options.length > 0 ? (
                                  stop.replacement_options.map((alt) => (
                                    <button
                                      key={alt.id}
                                      disabled={isReplacingThis}
                                      onClick={() => handleReplaceStop(sIndex, alt.id)}
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <span>Swap to {alt.name}</span>
                                    </button>
                                  ))
                                ) : (
                                  <button
                                    disabled={isReplacingThis}
                                    onClick={() => handleReplaceStop(sIndex, undefined, 'indoor cultural museum')}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 text-[10px] font-medium transition flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <RefreshCw className={`w-2.5 h-2.5 ${isReplacingThis ? 'animate-spin' : ''}`} />
                                    <span>Find another venue</span>
                                  </button>
                                )}

                                <button
                                  disabled={isReplacingThis}
                                  onClick={() => handleReplaceStop(sIndex, undefined, 'cheap budget free')}
                                  className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 hover:bg-emerald-900 text-emerald-300 text-[10px] font-medium transition"
                                >
                                  Make Cheaper
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 animate-pulse">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>AI is searching places & sequencing your schedule...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask: 'Plan a romantic evening', 'Make it cheaper'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
