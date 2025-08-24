import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { SubscriptionUpgradeModal } from '../SubscriptionUpgradeModal';

describe('SubscriptionUpgradeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnUpgrade.mockClear();
  });

  test('renders when isOpen is true', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
    expect(screen.getByText('You\'ve reached your free plan limit. Upgrade to Pro to continue using all features.')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={false}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.queryByText('Upgrade Required')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when "Maybe Later" button is clicked', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const maybeLaterButton = screen.getByRole('button', { name: 'Maybe Later' });
    fireEvent.click(maybeLaterButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onUpgrade when "Upgrade Now" button is clicked', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    const upgradeButton = screen.getByRole('button', { name: 'Upgrade Now' });
    fireEvent.click(upgradeButton);

    expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
  });

  test('displays custom title and message', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        title="Custom Title"
        message="Custom message content"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message content')).toBeInTheDocument();
  });

  test('displays pro plan features', () => {
    render(
      <SubscriptionUpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
      />
    );

    expect(screen.getByText('Pro Plan includes:')).toBeInTheDocument();
    expect(screen.getByText('Unlimited AI conversations')).toBeInTheDocument();
    expect(screen.getByText('Priority support')).toBeInTheDocument();
    expect(screen.getByText('Advanced code execution')).toBeInTheDocument();
    expect(screen.getByText('Enhanced collaboration tools')).toBeInTheDocument();
  });
});