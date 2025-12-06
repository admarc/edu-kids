/**
 * ResetPasswordForm Component
 *
 * Handles password reset using token from email
 * Validates token and allows user to set new password
 */

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormErrors {
  password?: string;
  confirmPassword?: string;
  form?: string;
}

interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [data, setData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Validate token presence
    if (!token) {
      setTokenValid(false);
      setErrors({
        form: "Link resetowania hasła jest nieprawidłowy lub wygasł. Poproś o nowy",
      });
    }
  }, [token]);

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordFormErrors = {};

    // Password validation
    if (!data.password) {
      newErrors.password = "Hasło jest wymagane";
    } else {
      if (data.password.length < 8) {
        newErrors.password = "Hasło musi mieć co najmniej 8 znaków";
      } else if (!/[A-Z]/.test(data.password)) {
        newErrors.password = "Hasło musi zawierać wielką literę";
      } else if (!/[a-z]/.test(data.password)) {
        newErrors.password = "Hasło musi zawierać małą literę";
      } else if (!/[0-9]/.test(data.password)) {
        newErrors.password = "Hasło musi zawierać cyfrę";
      }
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Hasła nie są identyczne";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!tokenValid) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 400) {
          setErrors({ form: "Link resetowania hasła jest nieprawidłowy lub wygasł" });
          setTokenValid(false);
        } else {
          setErrors({ form: error.message || "Wystąpił błąd podczas resetowania hasła" });
        }
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
        <AuthErrorAlert message="Hasło zmienione pomyślnie. Możesz się teraz zalogować" variant="success" />
        <Button asChild className="w-full">
          <a href="/login">Przejdź do logowania</a>
        </Button>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="space-y-4">
        <AuthErrorAlert
          message={errors.form || "Link resetowania hasła jest nieprawidłowy lub wygasł"}
          variant="error"
        />
        <Button asChild className="w-full" variant="outline">
          <a href="/forgot-password">Poproś o nowy link</a>
        </Button>
        <div className="text-center">
          <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <AuthErrorAlert message={errors.form} variant="error" />}

      <div className="text-sm text-gray-600 mb-4">Wprowadź nowe hasło dla swojego konta</div>

      <FormField
        id="password"
        label="Nowe hasło"
        type="password"
        value={data.password}
        onChange={(value) => setData({ ...data, password: value })}
        error={errors.password}
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />

      <div className="text-xs text-gray-600 -mt-2">
        Hasło musi zawierać: co najmniej 8 znaków, wielką literę, małą literę i cyfrę
      </div>

      <FormField
        id="confirmPassword"
        label="Powtórz nowe hasło"
        type="password"
        value={data.confirmPassword}
        onChange={(value) => setData({ ...data, confirmPassword: value })}
        error={errors.confirmPassword}
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Zmiana hasła..." : "Zmień hasło"}
      </Button>
    </form>
  );
}
