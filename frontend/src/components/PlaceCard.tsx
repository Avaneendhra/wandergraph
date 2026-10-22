import React, { useState } from 'react';
import {
  Star,
  MapPin,
  Clock,
  Coins,
  Network,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Info,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { ScoredRecommendation } from '../types';
import { getPhotoProxyUrl } from '../services/api';

interface PlaceCardProps {
  recommendation: ScoredRecommendation;
  onExploreInGraph: (placeId: string) => void;
  onViewDetails: (placeId: string) => void;
}

// Category fallback gradients and icons
const CATEGORY_STYLES: Record<string, { bg: string; label: string }> = {
  cafe: { bg: 'from-amber-900/40 to-orange-950/60', label: 'Cafe & Bakery' },
  restaurant: { bg: 'from-rose-900/40 to-red-950/60', label: 'Dining & Cuisine' },
  bar_nightlife: { bg: 'from-purple-900/40 to-indigo-950/60', label: 'Bar & Nightlife' },
  culture_history: { bg: 'from-blue-900/40 to-slate-950/60', label: 'Heritage & Culture' },
  nature_outdoors: { bg: 'from-emerald-900/40 to-teal-950/60', label: 'Parks & Nature' },
  shopping: { bg: 'from-fuchsia-900/40 to-pink-950/60', label: 'Shopping & Market' },
};

export const PlaceCard: React.FC<PlaceCardProps> = ({
  recommendation,
  onExploreInGraph,
  onViewDetails,
}) => {
  const { place, explanation, matched_reasons, unverified_attributes, match_confidence, total_score } = recommendation;
  const [imgError, setImgError] = useState(false);

  // Photo resolution
  const photo = place.photos && place.photos.length > 0 ? place.photos[0] : null;
  const photoUrl = photo
    ? photo.proxy_url || getPhotoProxyUrl(photo.name)
    : place.photo_reference;
  const attribution = photo?.attributions && photo.attributions.length > 0 ? photo.attributions[0] : null;

  // Price estimate resolution
  const pe = place.price_estimate;
  const currencySymbol = (pe?.currency || place.currency) === 'JPY' ? '¥' : '₹';

  // Category fallback style
  const primaryTypeKey = (place.primary_type || '').toLowerCase();
  const matchedCategory = Object.keys(CATEGORY_STYLES).find((k) => primaryTypeKey.includes(k)) || 'culture_history';
  const categoryStyle = CATEGORY_STYLES[matchedCategory];

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-200 overflow-hidden shadow-lg group">
      {/* 1. Photo Container with Lazy Loading & Attribution Overlay */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={place.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${categoryStyle.bg} flex flex-col items-center justify-center p-4 text-center`}>
            <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
            <span className="text-xs font-semibold text-slate-400">{categoryStyle.label}</span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Category Tag */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-2 py-0.5 rounded-md pointer-events-auto">
            {place.primary_type ? place.primary_type.replace(/_/g, ' ') : 'Landmark'}
          </span>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Match Confidence Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${
                match_confidence === 'high'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : match_confidence === 'moderate'
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700'
              }`}
              title={`Match score: ${total_score}`}
            >
              {match_confidence.toUpperCase()} MATCH
            </span>

            {/* Star Rating */}
            {place.rating !== undefined && place.rating !== null && (
              <div className="flex items-center space-x-1 text-xs font-bold text-amber-300 bg-slate-950/80 backdrop-blur-md border border-amber-500/40 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Photographer Attribution Overlay */}
        {attribution && (
          <div className="absolute bottom-1 right-2 max-w-[85%] text-[9px] text-slate-300 bg-slate-950/70 backdrop-blur-sm px-1.5 py-0.5 rounded truncate">
            <span className="inline-flex items-center gap-1">
              <Camera className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span>Photo:</span>
              {attribution.uri ? (
                <a
                  href={attribution.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white truncate"
                >
                  {attribution.display_name}
                </a>
              ) : (
                <span className="truncate">{attribution.display_name}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* 2. Place Details & Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Locality Tag & City */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
            {place.locality ? (
              <span className="font-semibold text-indigo-300">
                {place.locality}
                <span className="text-slate-400 font-normal">, {place.city.toUpperCase()}</span>
              </span>
            ) : (
              <span className="line-clamp-1">{place.formatted_address || place.city.toUpperCase()}</span>
            )}
          </div>

          {/* Place Title */}
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition duration-150 line-clamp-1">
            {place.name}
          </h3>

          {/* Price & Budget Breakdown (Local Currency ₹ / ¥) */}
          <div className="mt-2.5 py-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {pe ? (
                pe.is_free ? (
                  <span className="font-bold text-emerald-400">Free Admission</span>
                ) : pe.estimate_type === 'unknown' ? (
                  <span className="text-slate-400 italic text-[11px]" title={pe.methodology_note}>
                    Price unverified
                  </span>
                ) : (
                  <div>
                    <span className="font-semibold text-emerald-400">{pe.spending_range_text}</span>
                    {pe.admission_text && pe.admission_text !== pe.spending_range_text && (
                      <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={pe.admission_text}>
                        {pe.admission_text}
                      </span>
                    )}
                  </div>
                )
              ) : place.approx_cost !== undefined && place.approx_cost !== null ? (
                <span className="font-semibold text-emerald-400">
                  {place.approx_cost === 0 ? 'Free Admission' : `~${currencySymbol}${place.approx_cost.toLocaleString()}`}
                </span>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Price unverified</span>
              )}
            </div>

            {/* Opening Hours */}
            {place.opening_hours_text && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 max-w-[120px] truncate" title={place.opening_hours_text}>
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{place.opening_hours_text}</span>
              </div>
            )}
          </div>

          {/* Explainable Recommendation Banner */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
            <div className="flex items-start gap-1.5 text-indigo-200 text-[11px] leading-relaxed">
              <Info className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2">{explanation}</p>
            </div>

            {/* Matched Tags */}
            {matched_reasons.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {matched_reasons.slice(0, 3).map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded"
                  >
                    ✓ {reason}
                  </span>
                ))}
              </div>
            )}

            {/* Unverified attributes disclaimer */}
            {unverified_attributes.length > 0 && (
              <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-400/90 truncate">
                <AlertCircle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span className="truncate">{unverified_attributes.join(' • ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Card Footer with Provenance & Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span className="truncate max-w-[120px]" title={place.provenance?.source || 'Verified Source'}>
              {place.provenance?.source || 'Verified Source'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onExploreInGraph(place.id)}
              className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
              title="Inspect node in Knowledge Graph"
            >
              <Network className="w-3 h-3" />
              <span>Graph</span>
            </button>
            <button
              onClick={() => onViewDetails(place.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
            >
              <span>Details</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
