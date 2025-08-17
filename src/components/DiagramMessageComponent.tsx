import React from 'react';
import { motion } from 'framer-motion';
import DiagramRenderer from './DiagramRenderer';
import DiagramApprovalControls from './DiagramApprovalControls';

interface DiagramData {
  type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
  diagramText: string;
  isApproved?: boolean;
  userFeedback?: string;
  version: number;
}

interface DiagramMessageComponentProps {
  diagramData: DiagramData;
  messageId: string;
  onApprove: (messageId: string) => Promise<void>;
  onRequestChanges: (messageId: string, feedback: string) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export const DiagramMessageComponent: React.FC<DiagramMessageComponentProps> = ({
  diagramData,
  messageId,
  onApprove,
  onRequestChanges,
  isSubmitting = false,
  className = '',
}) => {
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    
    try {
      await onApprove(messageId);
      // You might want to show a success toast here
    } catch (error) {
      console.error('Failed to approve diagram:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve diagram';
      setError(errorMessage);
      // You might want to show an error toast here instead
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async (feedback: string) => {
    setIsRequestingChanges(true);
    setError(null);
    
    try {
      await onRequestChanges(messageId, feedback);
      // You might want to show a success toast here
    } catch (error) {
      console.error('Failed to request changes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to request changes';
      setError(errorMessage);
      // You might want to show an error toast here instead
    } finally {
      setIsRequestingChanges(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-4 ${className}`}
    >
      {/* Diagram Renderer */}
      <DiagramRenderer
        diagramText={diagramData.diagramText}
        type={diagramData.type}
        isLoading={isSubmitting}
      />

      {/* Approval Controls */}
      <DiagramApprovalControls
        isApproved={diagramData.isApproved}
        userFeedback={diagramData.userFeedback}
        version={diagramData.version}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
        isSubmitting={isSubmitting || isApproving || isRequestingChanges}
      />
      
      {/* Error message display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DiagramMessageComponent;