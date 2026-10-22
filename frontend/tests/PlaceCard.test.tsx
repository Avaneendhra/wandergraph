import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlaceCard } from '../src/components/PlaceCard';
import { ScoredRecommendation } from '../src/types';

describe('PlaceCard Component', () => {
  const mockRec: ScoredRecommendation = {
    place: {
      id: 'hyd_charminar',
      name: 'Charminar',
      city: 'hyderabad',
      formatted_address: 'Charminar Rd, Hyderabad',
      types: ['historical_monument'],
      primary_type: 'tourist_attraction',
      rating: 4.5,
      user_ratings_total: 142000,
      approx_cost: 50,
      currency: 'INR',
      opening_hours_text: '09:30 - 17:30 daily',
      provenance: {
        source: 'Archaeological Survey of India',
        verification_status: 'independently_verified',
      },
    },
    total_score: 9.5,
    matched_reasons: ['Within budget', 'Historical atmosphere'],
    unverified_attributes: [],
    explanation: 'Recommended in Hyderabad because it matches your historical atmosphere.',
    match_confidence: 'high',
  };

  it('renders place card with evidence explanation and attributes', () => {
    const handleGraph = vi.fn();
    const handleDetails = vi.fn();

    render(
      <PlaceCard
        recommendation={mockRec}
        onExploreInGraph={handleGraph}
        onViewDetails={handleDetails}
      />
    );

    expect(screen.getByText('Charminar')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText(/Recommended in Hyderabad/)).toBeInTheDocument();
    expect(screen.getByText('HIGH MATCH')).toBeInTheDocument();
    expect(screen.getByText('Archaeological Survey of India')).toBeInTheDocument();

    const graphBtn = screen.getByTitle('Inspect node in Knowledge Graph');
    fireEvent.click(graphBtn);
    expect(handleGraph).toHaveBeenCalledWith('hyd_charminar');
  });
});
