/**
 * DeleteAccountDialog Component
 *
 * Confirmation dialog for account deletion
 * Requires password confirmation as a security measure
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { FormField } from "./FormField";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { Button } from "../ui/button";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

interface DeleteAccountDialogErrors {
  password?: string;
  form?: string;
}

export function DeleteAccountDialog({ isOpen, onClose, userEmail }: DeleteAccountDialogProps) {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<DeleteAccountDialogErrors>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setPassword("");
    setErrors({});
    onClose();
  };

  const handleDelete = async () => {
    setErrors({});

    if (!password) {
      setErrors({ password: "Hasło jest wymagane do potwierdzenia" });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          setErrors({ password: "Hasło jest nieprawidłowe" });
        } else {
          setErrors({ form: error.message });
        }
        return;
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch {
      setErrors({
        form: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć konto?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              To działanie jest <strong>nieodwracalne</strong>. Wszystkie Twoje dane zostaną trwale usunięte:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Wszystkie tematy</li>
              <li>Wszystkie wygenerowane pytania</li>
              <li>Historia generowania</li>
              <li>Konto użytkownika ({userEmail})</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {errors.form && <AuthErrorAlert message={errors.form} variant="error" />}

          <FormField
            id="confirmPassword"
            label="Potwierdź hasło"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="Wprowadź swoje hasło"
            autoComplete="current-password"
            disabled={isDeleting}
            required
          />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Usuwanie..." : "Tak, usuń moje konto"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
