/**
 * ForgotPasswordForm Component
 *
 * Handles password reset request by email
 * Shows success message regardless of whether email exists (security best practice)
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormErrors {
  email?: string;
  form?: string;
}

export function ForgotPasswordForm() {
  const [data, setData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordFormErrors = {};

    // Email validation
    if (!data.email) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Podaj poprawny adres email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrors({ form: error.message });
        return;
      }

      setSuccess(true);
    } catch {
      setErrors({
        form: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <AuthErrorAlert
          message="Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła"
          variant="success"
        />
        <Button asChild className="w-full" variant="outline">
          <a href="/login">Wróć do logowania</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <AuthErrorAlert message={errors.form} variant="error" />}

      <div className="text-sm text-gray-600 mb-4">
        Podaj adres email użyty podczas rejestracji. Wyślemy Ci link do resetowania hasła.
      </div>

      <FormField
        id="email"
        label="Email"
        type="email"
        value={data.email}
        onChange={(value) => setData({ ...data, email: value })}
        error={errors.email}
        placeholder="twoj@email.pl"
        autoComplete="email"
        required
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>

      <div className="text-center text-sm text-gray-600">
        <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Wróć do logowania
        </a>
      </div>
    </form>
  );
}
