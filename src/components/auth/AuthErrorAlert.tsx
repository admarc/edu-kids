/**
 * AuthErrorAlert Component
 *
 * Displays error, warning, info, or success messages in authentication forms
 */

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface AuthErrorAlertProps {
  message: string;
  variant?: "error" | "warning" | "info" | "success";
}

export function AuthErrorAlert({ message, variant = "error" }: AuthErrorAlertProps) {
  const styles = {
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <Info className="h-5 w-5 text-blue-600" />,
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    },
  };

  const style = styles[variant];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.container}`} role="alert">
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <p className="text-sm flex-1">{message}</p>
    </div>
  );
}
