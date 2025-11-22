/**
 * RegisterForm Component
 *
 * Handles user registration with email, password, and password confirmation
 * Includes enhanced client-side validation for password strength
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export function RegisterForm() {
  const [data, setData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    // Email validation
    if (!data.email) {
      newErrors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Podaj poprawny adres email";
    }

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
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors (400)
        if (response.status === 400 && result.details) {
          const newErrors: RegisterFormErrors = {};
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

        // Handle user already exists (409)
        if (response.status === 409) {
          setErrors({ form: "Ten adres email jest już zarejestrowany" });
          return;
        }

        // Handle other errors
        setErrors({ form: result.message || "Wystąpił błąd podczas rejestracji" });
        return;
      }

      // Success - show confirmation message
      setSuccessMessage(result.message);
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
          message={
            successMessage || "Konto utworzone! Sprawdź swoją skrzynkę email i potwierdź adres, aby się zalogować."
          }
          variant="success"
        />
        <Button asChild className="w-full">
          <a href="/login">Przejdź do logowania</a>
        </Button>
      </div>
    );
  }

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
        autoComplete="new-password"
        required
      />

      <div className="text-xs text-gray-600 -mt-2">
        Hasło musi zawierać: co najmniej 8 znaków, wielką literę, małą literę i cyfrę
      </div>

      <FormField
        id="confirmPassword"
        label="Powtórz hasło"
        type="password"
        value={data.confirmPassword}
        onChange={(value) => setData({ ...data, confirmPassword: value })}
        error={errors.confirmPassword}
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

      <div className="text-center text-sm text-gray-600">
        Masz już konto?{" "}
        <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
