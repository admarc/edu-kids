/**
 * ToasterProvider Component
 *
 * Wrapper component for Sonner Toaster
 * Provides toast notifications throughout the app
 */

import { Toaster } from "./ui/sonner";

export function ToasterProvider() {
  return <Toaster richColors position="top-right" />;
}

