import { render, screen, fireEvent } from '@testing-library/react';
import { AgentModeSwitch, type AgentMode, type AgentType } from './AgentModeSwitch';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bot: ({ className }: { className?: string }) => <div data-testid="bot-icon" className={className} />,
  Zap: ({ className }: { className?: string }) => <div data-testid="zap-icon" className={className} />,
  Brain: ({ className }: { className?: string }) => <div data-testid="brain-icon" className={className} />,
  Workflow: ({ className }: { className?: string }) => <div data-testid="workflow-icon" className={className} />,
  Activity: ({ className }: { className?: string }) => <div data-testid="activity-icon" className={className} />,
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
  Settings: ({ className }: { className?: string }) => <div data-testid="settings-icon" className={className} />,
  Users: ({ className }: { className?: string }) => <div data-testid="users-icon" className={className} />
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' ')
}));

const mockBackgroundAgents = [
  {
    id: 'agent-1',
    type: 'developer' as AgentType,
    status: 'working' as const,
    currentTask: 'Implementing user authentication',
    progress: 75,
    estimatedCompletion: new Date(Date.now() + 300000) // 5 minutes from now
  },
  {
    id: 'agent-2', 
    type: 'reviewer' as AgentType,
    status: 'idle' as const,
    progress: 0
  },
  {
    id: 'agent-3',
    type: 'architect' as AgentType,
    status: 'completed' as const,
    currentTask: 'System design completed',
    progress: 100
  }
];

describe('AgentModeSwitch', () => {
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    mockOnModeChange.mockClear();
  });

  describe('Mode Selection', () => {
    it('should render all three mode options', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast" 
          onModeChange={mockOnModeChange} 
        />
      );

      expect(screen.getByText('Fast Mode')).toBeInTheDocument();
      expect(screen.getByText('Deep Mode')).toBeInTheDocument();
      expect(screen.getByText('Background Mode')).toBeInTheDocument();
    });

    it('should highlight the current mode correctly', () => {
      render(
        <AgentModeSwitch 
          currentMode="deep" 
          onModeChange={mockOnModeChange} 
        />
      );

      const deepModeButton = screen.getByText('Deep Mode').closest('button');
      const fastModeButton = screen.getByText('Fast Mode').closest('button');
      
      expect(deepModeButton).toHaveClass('bg-purple-50', 'border-purple-200');
      expect(fastModeButton).not.toHaveClass('bg-purple-50');
    });

    it('should call onModeChange when a different mode is selected', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast" 
          onModeChange={mockOnModeChange} 
        />
      );

      const deepModeButton = screen.getByText('Deep Mode').closest('button');
      fireEvent.click(deepModeButton!);

      expect(mockOnModeChange).toHaveBeenCalledWith('deep');
    });

    it('should not call onModeChange when disabled', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast" 
          onModeChange={mockOnModeChange}
          disabled={true}
        />
      );

      const deepModeButton = screen.getByText('Deep Mode').closest('button');
      fireEvent.click(deepModeButton!);

      expect(mockOnModeChange).not.toHaveBeenCalled();
    });

    it('should show disabled styling when disabled prop is true', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast" 
          onModeChange={mockOnModeChange}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });
  });

  describe('Background Mode Display', () => {
    it('should show background agents when in background mode', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={mockBackgroundAgents}
          showBackgroundStatus={true}
        />
      );

      expect(screen.getByText('Background Agents')).toBeInTheDocument();
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('should not show background agents when not in background mode', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast"
          onModeChange={mockOnModeChange}
          backgroundAgents={mockBackgroundAgents}
          showBackgroundStatus={true}
        />
      );

      expect(screen.queryByText('Background Agents')).not.toBeInTheDocument();
    });

    it('should display individual agent information correctly', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={mockBackgroundAgents}
          showBackgroundStatus={true}
        />
      );

      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('working')).toBeInTheDocument();
      expect(screen.getByText('Implementing user authentication')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show estimated completion time for working agents', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={mockBackgroundAgents}
          showBackgroundStatus={true}
        />
      );

      // Should show time remaining (5 minutes = 5m)
      expect(screen.getByText('5m')).toBeInTheDocument();
    });

    it('should limit displayed agents to 3 and show count for additional agents', () => {
      const manyAgents = Array.from({ length: 6 }, (_, i) => ({
        id: `agent-${i}`,
        type: 'developer' as AgentType,
        status: 'working' as const,
        currentTask: `Task ${i}`,
        progress: 50
      }));

      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={manyAgents}
          showBackgroundStatus={true}
        />
      );

      expect(screen.getByText('+3 more agents working')).toBeInTheDocument();
    });

    it('should show empty state when no background agents are active', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={[]}
          showBackgroundStatus={true}
        />
      );

      expect(screen.getByText('No background agents currently active')).toBeInTheDocument();
      expect(screen.getByText('Agents will appear here when tasks are running')).toBeInTheDocument();
    });
  });

  describe('Mode Information Display', () => {
    it('should show fast mode info when in fast mode', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Single AI agent • Optimized for speed')).toBeInTheDocument();
    });

    it('should show deep mode info when in deep mode', () => {
      render(
        <AgentModeSwitch 
          currentMode="deep"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Advanced reasoning • Higher quality responses')).toBeInTheDocument();
    });

    it('should not show mode info when in background mode', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.queryByText('Single AI agent • Optimized for speed')).not.toBeInTheDocument();
      expect(screen.queryByText('Advanced reasoning • Higher quality responses')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors and Progress', () => {
    it('should apply correct status colors based on agent status', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={mockBackgroundAgents}
          showBackgroundStatus={true}
        />
      );

      const workingStatus = screen.getByText('working');
      const idleStatus = screen.getByText('idle');
      const completedStatus = screen.getByText('completed');

      expect(workingStatus).toHaveClass('text-blue-600', 'bg-blue-100');
      expect(idleStatus).toHaveClass('text-gray-600', 'bg-gray-100');
      expect(completedStatus).toHaveClass('text-green-600', 'bg-green-100');
    });

    it('should show correct progress bar colors based on progress percentage', () => {
      const agentVariations = [
        { progress: 20, expectedColor: 'bg-red-500' },
        { progress: 40, expectedColor: 'bg-yellow-500' },
        { progress: 65, expectedColor: 'bg-blue-500' },
        { progress: 90, expectedColor: 'bg-green-500' }
      ];

      agentVariations.forEach(({ progress, expectedColor }) => {
        const agent = {
          id: `test-agent-${progress}`,
          type: 'developer' as AgentType,
          status: 'working' as const,
          progress
        };

        const { container } = render(
          <AgentModeSwitch 
            currentMode="background"
            onModeChange={mockOnModeChange}
            backgroundAgents={[agent]}
            showBackgroundStatus={true}
          />
        );

        const progressBar = container.querySelector('.h-1\\.5.rounded-full.transition-all');
        expect(progressBar).toHaveClass(expectedColor);
      });
    });
  });

  describe('Accessibility and Interactions', () => {
    it('should have proper ARIA attributes and be keyboard accessible', () => {
      render(
        <AgentModeSwitch 
          currentMode="fast"
          onModeChange={mockOnModeChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Each button should be focusable
        fireEvent.focus(button);
        expect(document.activeElement).toBe(button);
      });
    });

    it('should support custom className', () => {
      const { container } = render(
        <AgentModeSwitch 
          currentMode="fast"
          onModeChange={mockOnModeChange}
          className="custom-test-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined backgroundAgents gracefully', () => {
      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          showBackgroundStatus={true}
        />
      );

      expect(screen.getByText('No background agents currently active')).toBeInTheDocument();
    });

    it('should filter only active/working agents for display count', () => {
      const mixedAgents = [
        { id: '1', type: 'developer' as AgentType, status: 'working' as const, progress: 50 },
        { id: '2', type: 'reviewer' as AgentType, status: 'completed' as const, progress: 100 },
        { id: '3', type: 'deployer' as AgentType, status: 'failed' as const, progress: 25 },
        { id: '4', type: 'architect' as AgentType, status: 'idle' as const, progress: 0 }
      ];

      render(
        <AgentModeSwitch 
          currentMode="background"
          onModeChange={mockOnModeChange}
          backgroundAgents={mixedAgents}
          showBackgroundStatus={true}
        />
      );

      // Should show 2 active (working + idle)
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });
  });
});