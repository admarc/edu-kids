# Authentication UI Components

Komponenty interfejsu użytkownika dla procesu autentykacji (logowanie, rejestracja, odzyskiwanie hasła).

## 📋 Spis komponentów

### Współdzielone komponenty

- **AuthFormContainer** - Wrapper dla formularzy autentykacji z spójnym layoutem
- **FormField** - Pole formularza z etykietą, inputem i wyświetlaniem błędów
- **AuthErrorAlert** - Wyświetlanie komunikatów (error, warning, info, success)

### Formularze autentykacji

- **LoginForm** - Formularz logowania (email + hasło)
- **RegisterForm** - Formularz rejestracji (email + hasło + potwierdzenie)
- **ForgotPasswordForm** - Formularz żądania resetu hasła
- **ResetPasswordForm** - Formularz ustawiania nowego hasła
- **ChangePasswordForm** - Formularz zmiany hasła (dla zalogowanych)
- **DeleteAccountDialog** - Dialog potwierdzenia usunięcia konta

## 🗂️ Strony Astro

Wszystkie strony znajdują się w `src/pages/`:

- `/login` - Strona logowania
- `/register` - Strona rejestracji  
- `/forgot-password` - Strona żądania resetu hasła
- `/reset-password` - Strona ustawiania nowego hasła (z tokenem w URL)
- `/settings` - Strona ustawień konta (zmiana hasła, usunięcie konta)

## 🎨 Stylistyka

Komponenty wykorzystują:
- **Tailwind CSS** dla stylowania
- **shadcn/ui** dla komponentów bazowych (Button, Input, Dialog, Alert, Card)
- **lucide-react** dla ikon
- Spójną paletę kolorów (indigo jako kolor główny)

## 🔌 Integracja z backendem

Wszystkie formularze zawierają zakomentowane sekcje TODO z przykładami wywołań API:

```typescript
// TODO: Call API endpoint POST /api/auth/login
// const response = await fetch('/api/auth/login', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(data),
// });
```

Po implementacji backendu należy:
1. Odkomentować kod wywołań API
2. Usunąć `console.log` placeholdery
3. Przetestować przepływy użytkownika

## ✅ Walidacja

Wszystkie formularze zawierają walidację kliencką:

### LoginForm
- Email: format email, wymagany
- Hasło: min. 6 znaków, wymagane

### RegisterForm
- Email: format email, wymagany
- Hasło: min. 8 znaków, wielka litera, mała litera, cyfra
- Potwierdzenie hasła: musi być identyczne

### ChangePasswordForm
- Aktualne hasło: wymagane
- Nowe hasło: min. 8 znaków, wielka litera, mała litera, cyfra
- Potwierdzenie: musi być identyczne

### ResetPasswordForm
- Token: weryfikowany z URL
- Hasło: min. 8 znaków, wielka litera, mała litera, cyfra
- Potwierdzenie: musi być identyczne

## 🧪 Testowanie UI

Aby przetestować komponenty bez backendu:

1. Uruchom dev server: `npm run dev`
2. Nawiguj do `/login`, `/register`, itp.
3. Wypełnij formularze - walidacja działa po stronie klienta
4. Sprawdź console.log dla placeholderów API

## 📦 Wymagane zależności

Projekt wymaga zainstalowania:

```bash
npm install @radix-ui/react-dropdown-menu
```

Komponenty wykorzystują również (już zainstalowane):
- @radix-ui/react-dialog
- @radix-ui/react-alert-dialog
- @radix-ui/react-avatar
- lucide-react

## 🚀 Następne kroki (implementacja backendu)

1. Utworzenie endpointów API w `src/pages/api/auth/`:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`
   - `POST /api/auth/change-password`
   - `DELETE /api/auth/account`

2. Implementacja `AuthService` w `src/lib/services/auth.service.ts`

3. Konfiguracja Astro middleware dla ochrony stron

4. Aktualizacja Layout.astro o Navigation component

Więcej szczegółów w `.ai/auth-spec.md`

