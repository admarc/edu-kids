/**
 * LoginForm Component
 *
 * Handles user login with email and password
 * Includes client-side validation and error handling
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export function LoginForm() {
  const [data, setData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    // Email validation
    if (!data.email) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Podaj poprawny adres email";
    }

    // Password validation
    if (!data.password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (data.password.length < 6) {
      newErrors.password = "Hasło musi mieć co najmniej 6 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors (400)
        if (response.status === 400 && result.details) {
          const newErrors: LoginFormErrors = {};
          result.details.forEach((detail: { field: string; message: string }) => {
            if (detail.field === "email") {
              newErrors.email = detail.message;
            } else if (detail.field === "password") {
              newErrors.password = detail.message;
            }
          });
          setErrors(newErrors);
          return;
        }

        // Handle other errors (401, 403, etc.)
        setErrors({ form: result.message || "Wystąpił błąd podczas logowania" });
        return;
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch {
      setErrors({
        form: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <AuthErrorAlert message={errors.form} variant="error" />}

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

      <FormField
        id="password"
        label="Hasło"
        type="password"
        value={data.password}
        onChange={(value) => setData({ ...data, password: value })}
        error={errors.password}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-end">
        <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
          Zapomniałeś hasła?
        </a>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <div className="text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Zarejestruj się
        </a>
      </div>
    </form>
  );
}
