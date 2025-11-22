/**
 * AuthFormContainer Component
 *
 * Wrapper component for authentication forms
 * Provides consistent layout, styling, and responsive design
 */

import type { ReactNode } from "react";

interface AuthFormContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthFormContainer({ children, title, description }: AuthFormContainerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">EduKids</h1>
          <p className="text-gray-600">Generator pytań edukacyjnych</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
