import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Star,
  Clock,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Compass,
  Navigation,
  Network,
} from 'lucide-react';
import { PlaceSearchResult } from '../types';
import { fetchPlaceDetails } from '../services/api';

interface PlaceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string | null;
  onExploreInGraph: (placeId: string) => void;
}

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({
  isOpen,
  onClose,
  placeId,
  onExploreInGraph,
}) => {
  const [data, setData] = useState<{ place: PlaceSearchResult; graph_connections?: any } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !placeId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetchPlaceDetails(placeId)
      .then((res) => setData(res))
      .catch((err) => console.error('Error fetching place details:', err))
      .finally(() => setLoading(false));
  }, [isOpen, placeId]);

  if (!isOpen) return null;

  const place = data?.place;
  const graph = data?.graph_connections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                {place?.primary_type?.replace(/_/g, ' ') || 'Place'}
              </span>
              {place?.city && (
                <span className="text-xs text-slate-400 capitalize">
                  • {place.city}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{place?.name || 'Loading Place Details...'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Compass className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading place details and graph connections...</p>
          </div>
        ) : place ? (
          <div className="py-4 space-y-5">
            {/* Address & Navigation */}
            <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{place.formatted_address || 'Address not listed'}</span>
              </div>
              {place.name && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${place.name} ${place.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Rating */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Rating</span>
                <div className="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{place.rating ? place.rating.toFixed(1) : 'Unrated'}</span>
                  {place.user_ratings_total && (
                    <span className="text-xs font-normal text-slate-400">({place.user_ratings_total.toLocaleString()})</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Estimated Cost</span>
                <div className="flex items-center gap-1 font-bold text-emerald-400 text-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {place.approx_cost !== undefined && place.approx_cost !== null
                      ? place.approx_cost === 0
                        ? 'Free'
                        : `${place.currency || '₹'} ${place.approx_cost.toLocaleString()}`
                      : 'Unverified'}
                  </span>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs col-span-2 sm:col-span-1">
                <span className="text-slate-400 block mb-1">Hours</span>
                <div className="flex items-center gap-1 font-medium text-slate-300 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{place.opening_hours_text || 'Standard daytime hours'}</span>
                </div>
              </div>
            </div>

            {/* Connected Knowledge Graph Semantic Relations */}
            {graph && (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-indigo-400" />
                    Knowledge Graph Semantic Connections
                  </span>
                  <button
                    onClick={() => {
                      onExploreInGraph(place.id);
                      onClose();
                    }}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Explore Subgraph →
                  </button>
                </div>

                {/* Companions */}
                {graph.connected_companions?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Suitable For:</span>
                    <div className="flex flex-wrap gap-1">
                      {graph.connected_companions.map((c: string) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] capitalize">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Atmospheres */}
                {graph.connected_atmospheres?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-24 shrink-0">Atmosphere:</span>
                    <div className="flex flex-wrap gap-1">
                      {graph.connected_atmospheres.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] capitalize">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Places in Graph */}
                {graph.nearby_places?.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <span className="text-slate-400 w-24 shrink-0">Nearby in KG:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {graph.nearby_places.map((np: any) => (
                        <span key={np.id} className="text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {np.name} ({np.distance_km} km)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provenance Box */}
            {place.provenance && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Source: <strong className="text-slate-300">{place.provenance.source || 'Verified Source'}</strong>
                  </span>
                </div>
                <span className="text-emerald-400 font-mono text-[10px] uppercase">
                  {place.provenance.verification_status || 'Verified'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-slate-500">Details unavailable for this place.</p>
        )}
      </div>
    </div>
  );
};
