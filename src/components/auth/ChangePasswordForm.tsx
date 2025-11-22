/**
 * ChangePasswordForm Component
 *
 * Allows authenticated user to change their password
 * Requires current password for verification
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
}

export function ChangePasswordForm() {
  const [data, setData] = useState<ChangePasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ChangePasswordFormErrors = {};

    // Current password validation
    if (!data.currentPassword) {
      newErrors.currentPassword = "Aktualne hasło jest wymagane";
    }

    // New password validation
    if (!data.newPassword) {
      newErrors.newPassword = "Nowe hasło jest wymagane";
    } else {
      if (data.newPassword.length < 8) {
        newErrors.newPassword = "Hasło musi mieć co najmniej 8 znaków";
      } else if (!/[A-Z]/.test(data.newPassword)) {
        newErrors.newPassword = "Hasło musi zawierać wielką literę";
      } else if (!/[a-z]/.test(data.newPassword)) {
        newErrors.newPassword = "Hasło musi zawierać małą literę";
      } else if (!/[0-9]/.test(data.newPassword)) {
        newErrors.newPassword = "Hasło musi zawierać cyfrę";
      }
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (data.newPassword !== data.confirmPassword) {
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
      // TODO: Call API endpoint POST /api/auth/change-password
      // const response = await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentPassword: data.currentPassword,
      //     newPassword: data.newPassword,
      //   }),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   if (response.status === 401) {
      //     setErrors({ currentPassword: 'Aktualne hasło jest nieprawidłowe' });
      //   } else {
      //     setErrors({ form: error.message });
      //   }
      //   return;
      // }
      //
      // setSuccess(true);
      // // Reset form
      // setData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      console.log("Change password form submitted");
      setSuccess(true);
      setData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // Temporary placeholder - will be implemented with backend
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
      {success && <AuthErrorAlert message="Hasło zostało zmienione pomyślnie" variant="success" />}
      {errors.form && <AuthErrorAlert message={errors.form} variant="error" />}

      <FormField
        id="currentPassword"
        label="Aktualne hasło"
        type="password"
        value={data.currentPassword}
        onChange={(value) => setData({ ...data, currentPassword: value })}
        error={errors.currentPassword}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      <FormField
        id="newPassword"
        label="Nowe hasło"
        type="password"
        value={data.newPassword}
        onChange={(value) => setData({ ...data, newPassword: value })}
        error={errors.newPassword}
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
