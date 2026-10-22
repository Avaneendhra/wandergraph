import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../src/components/Navbar';

describe('Navbar Component', () => {
  it('renders WanderGraph branding and city name', () => {
    const handleCity = vi.fn();
    const handleGraph = vi.fn();

    render(
      <Navbar
        currentCityName="Kyoto"
        onOpenCitySelector={handleCity}
        onOpenGraph={handleGraph}
        providerStatus={{
          provider_name: 'Mock Provider',
          is_live: false,
          api_key_configured: false,
          status_message: 'Dev Mode Active',
        }}
      />
    );

    expect(screen.getByText('Wander')).toBeInTheDocument();
    expect(screen.getByText('Graph')).toBeInTheDocument();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Graph Explorer')).toBeInTheDocument();
  });
});
