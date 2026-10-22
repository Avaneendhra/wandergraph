import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InterpretationBanner } from '../src/components/InterpretationBanner';
import { InterpretedCriteria } from '../src/types';

describe('InterpretationBanner Component', () => {
  const mockCriteria: InterpretedCriteria = {
    original_query: 'peaceful cfe in hydrabad',
    corrected_query: 'peaceful cafe in hyderabad',
    detected_city: 'hyderabad',
    detected_locality: 'Uppal',
    detected_category: 'cafe',
    detected_atmospheres: ['peaceful'],
    detected_companion: 'couples',
    detected_budget: 1000,
    was_corrected: true,
    explanation_banner: 'Interpreted as: **Cafe** in **Uppal** (Hyderabad) • Atmosphere: Peaceful',
  };

  it('renders interpretation banner with corrected query and dismisses', () => {
    const handleDismiss = vi.fn();

    render(
      <InterpretationBanner
        criteria={mockCriteria}
        onDismiss={handleDismiss}
      />
    );

    expect(screen.getByText('Intelligent Search Interpretation')).toBeInTheDocument();
    expect(screen.getByText('Spelling & Locality Corrected')).toBeInTheDocument();
    expect(screen.getByText('peaceful cfe in hydrabad')).toBeInTheDocument();
    expect(screen.getByText('peaceful cafe in hyderabad')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss banner');
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('returns null when criteria is empty', () => {
    const { container } = render(
      <InterpretationBanner criteria={null} onDismiss={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
