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
  const handleApprove = async () => {
    await onApprove(messageId);
  };

  const handleRequestChanges = async (feedback: string) => {
    await onRequestChanges(messageId, feedback);
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
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};

export default DiagramMessageComponent;