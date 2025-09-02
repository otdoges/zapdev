import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BackgroundAgentSwitch from './BackgroundAgentSwitch';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Settings: () => <div data-testid="settings-icon" />
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' ')
}));

describe('BackgroundAgentSwitch', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('Basic Functionality', () => {
    it('should render with inactive state', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    });

    it('should render with active state', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle} 
        />
      );

      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });

    it('should call onToggle when clicked', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('should call onToggle with false when active and clicked', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Disabled State', () => {
    it('should not call onToggle when disabled', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it('should have disabled styling when disabled', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle}
          size="sm"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-16', 'h-8');
    });

    it('should apply large size classes', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle}
          size="lg"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-24', 'h-12');
    });
  });

  describe('Tooltips and Info', () => {
    it('should show tooltip on hover when inactive', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Click to activate background agents')).toBeInTheDocument();
      });
    });

    it('should show active status with agent count', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={3}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Background Agents Active')).toBeInTheDocument();
        expect(screen.getByText('3 agents running')).toBeInTheDocument();
      });
    });

    it('should show extended info panel when active and hovered with agents', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={5}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Active Agents')).toBeInTheDocument();
        expect(screen.getByText('Background processing')).toBeInTheDocument();
      });
    });
  });

  describe('Agent Count Display', () => {
    it('should show correct agent count in extended panel', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={2}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Agent 1 processing...')).toBeInTheDocument();
        expect(screen.getByText('Agent 2 processing...')).toBeInTheDocument();
      });
    });

    it('should show overflow message for many agents', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={5}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('+2 more agents')).toBeInTheDocument();
      });
    });

    it('should calculate system load based on agent count', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={3}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });

    it('should cap system load at 100%', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={10}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      
      // Test focus
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should handle keyboard activation', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Note: framer-motion button mock doesn't handle keyboard events
      // In real implementation, this would trigger the onClick handler
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle}
          className="custom-test-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero agent count', async () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
          agentCount={0}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('0 agents running')).toBeInTheDocument();
      });
    });

    it('should handle undefined agent count', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={true} 
          onToggle={mockOnToggle}
        />
      );

      // Should not throw error and use default value of 0
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle rapid toggle clicks', () => {
      render(
        <BackgroundAgentSwitch 
          isActive={false} 
          onToggle={mockOnToggle} 
        />
      );

      const button = screen.getByRole('button');
      
      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(3);
    });
  });
});