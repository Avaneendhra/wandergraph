import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ItineraryChatbot } from '../src/components/ItineraryChatbot';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ItineraryChatbot Component', () => {
  it('renders floating launcher button and opens chat panel on click', () => {
    render(
      <ItineraryChatbot
        sessionId="test-session"
        cityName="Hyderabad"
        cityId="hyderabad"
      />
    );

    const launcher = screen.getByLabelText('Open AI Itinerary Planner');
    expect(launcher).toBeInTheDocument();

    // Click to open panel
    fireEvent.click(launcher);

    expect(screen.getByText('WanderGraph Itinerary AI')).toBeInTheDocument();
    expect(screen.getByText('Hyderabad')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask: 'Plan a romantic evening'/)).toBeInTheDocument();

    // Close panel
    const closeBtn = screen.getByLabelText('Close Chat');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('WanderGraph Itinerary AI')).not.toBeInTheDocument();
  });
});
