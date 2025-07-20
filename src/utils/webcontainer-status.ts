import React, { ReactElement } from "react";
import { WebContainerStatus } from "@/types/webcontainer";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  FileText 
} from "lucide-react";

/**
 * Get the appropriate CSS classes for status badge styling
 */
export const getStatusColor = (status: WebContainerStatus): string => {
  switch (status) {
    case "installing":
    case "building":
      return "bg-blue-500/20 text-blue-400";
    case "running":
      return "bg-yellow-500/20 text-yellow-400";
    case "success":
      return "bg-green-500/20 text-green-400";
    case "error":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

/**
 * Get the appropriate icon component for the current status
 */
export const getStatusIcon = (status: WebContainerStatus): ReactElement => {
  switch (status) {
    case "installing":
    case "building":
    case "running":
      return React.createElement(Loader2, { className: "w-3 h-3 animate-spin" });
    case "success":
      return React.createElement(CheckCircle, { className: "w-3 h-3" });
    case "error":
      return React.createElement(AlertCircle, { className: "w-3 h-3" });
    default:
      return React.createElement(FileText, { className: "w-3 h-3" });
  }
};

/**
 * Get human-readable status text
 */
export const getStatusText = (status: WebContainerStatus): string => {
  switch (status) {
    case "installing":
      return "Installing";
    case "building":
      return "Building";
    case "running":
      return "Running";
    case "success":
      return "Ready";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}; 