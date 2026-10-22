import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreferenceChips } from '../src/components/PreferenceChips';
import { PreferenceState } from '../src/types';

describe('PreferenceChips Component', () => {
  const mockPreferences: PreferenceState = {
    session_id: 'test-session',
    city: 'tokyo',
    companion_type: 'couples',
    budget_max: 3000,
    currency: 'JPY',
    atmosphere: ['peaceful'],
    preferred_time: 'evening',
    interests: [],
    desired_activities: [],
    accessibility_requirements: ['wheelchair_accessible'],
  };

  it('renders all active constraints as chips', () => {
    const handleRemove = vi.fn();
    const handleReset = vi.fn();

    render(
      <PreferenceChips
        preferences={mockPreferences}
        onRemoveField={handleRemove}
        onResetPreferences={handleReset}
      />
    );

    expect(screen.getByText('City: Tokyo')).toBeInTheDocument();
    expect(screen.getByText('With: Couples')).toBeInTheDocument();
    expect(screen.getByText(/Max (JPY|¥)\s*3,000/)).toBeInTheDocument();
    expect(screen.getByText('Vibe: Peaceful')).toBeInTheDocument();
    expect(screen.getByText('Time: Evening')).toBeInTheDocument();
    expect(screen.getByText('Wheelchair Accessible')).toBeInTheDocument();
  });

  it('triggers remove constraint when remove button is clicked', () => {
    const handleRemove = vi.fn();
    const handleReset = vi.fn();

    render(
      <PreferenceChips
        preferences={mockPreferences}
        onRemoveField={handleRemove}
        onResetPreferences={handleReset}
      />
    );

    const removeCompanionBtn = screen.getByLabelText('Remove companion');
    fireEvent.click(removeCompanionBtn);
    expect(handleRemove).toHaveBeenCalledWith('companion_type');
  });
});
