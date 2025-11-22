# Specyfikacja Techniczna Modułu Autentykacji - EduKids

## 1. WPROWADZENIE

### 1.1. Cel dokumentu
Niniejszy dokument przedstawia szczegółową architekturę techniczną modułu autentykacji dla aplikacji EduKids. Specyfikacja obejmuje implementację rejestracji, logowania, wylogowania, odzyskiwania hasła, zmiany hasła oraz usuwania konta użytkownika.

### 1.2. Zakres funkcjonalny
Moduł autentykacji realizuje następujące historyjki użytkownika z PRD:
- **US-001**: Rejestracja użytkownika (email + hasło)
- **US-002**: Logowanie użytkownika (email + hasło)
- **US-003**: Zmiana hasła dla zalogowanego użytkownika
- **US-004**: Usunięcie konta użytkownika
- **US-013**: Bezpieczny dostęp - wymuszenie logowania dla wszystkich funkcjonalności aplikacji

### 1.3. Założenia architektoniczne
- **Brak zewnętrznych dostawców OAuth**: Wyłącznie email + hasło
- **Server-Side Rendering (SSR)**: Astro z output="server"
- **Supabase Auth**: Wbudowany system autentykacji Supabase jako podstawa
- **Session-based Auth**: Wykorzystanie ciasteczek HTTP-only dla sesji
- **Row Level Security (RLS)**: Automatyczne zabezpieczenie danych na poziomie bazy danych
- **Middleware Protection**: Astro middleware do weryfikacji dostępu do chronionych zasobów

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron i nawigacji

#### 2.1.1. Nowe strony publiczne (non-auth)

**Strona logowania: `/login` (`src/pages/login.astro`)**
```typescript
// Typ: Strona Astro z SSR
// Opis: Dedykowana strona logowania z formularzem client-side React
// Middleware: Publiczny dostęp (redirect do /topics jeśli już zalogowany)
// Komponenty: LoginForm (React)
```

**Strona rejestracji: `/register` (`src/pages/register.astro`)**
```typescript
// Typ: Strona Astro z SSR
// Opis: Dedykowana strona rejestracji z formularzem client-side React
// Middleware: Publiczny dostęp (redirect do /topics jeśli już zalogowany)
// Komponenty: RegisterForm (React)
```

**Strona odzyskiwania hasła: `/forgot-password` (`src/pages/forgot-password.astro`)**
```typescript
// Typ: Strona Astro z SSR
// Opis: Formularz do wysłania linku resetującego hasło na email
// Middleware: Publiczny dostęp
// Komponenty: ForgotPasswordForm (React)
```

**Strona resetowania hasła: `/reset-password` (`src/pages/reset-password.astro`)**
```typescript
// Typ: Strona Astro z SSR
// Opis: Formularz ustawiania nowego hasła po kliknięciu w link z emaila
// Middleware: Publiczny dostęp
// Query params: token (z linku w emailu)
// Komponenty: ResetPasswordForm (React)
```

#### 2.1.2. Modyfikacje stron istniejących (wymóg autentykacji)

Wszystkie istniejące strony wymagają uwierzytelnienia zgodnie z US-013:
- `/` → przekierowanie do `/login` dla niezalogowanych
- `/topics` → wymagane uwierzytelnienie
- `/generate` → wymagane uwierzytelnienie
- Wszystkie API endpoints → wymagane uwierzytelnienie (oprócz endpointów auth)

#### 2.1.3. Strona ustawień konta: `/settings` (`src/pages/settings.astro`)

```typescript
// Typ: Strona Astro z SSR + komponenty React
// Opis: Panel użytkownika z możliwością:
//   - Zmiany hasła
//   - Usunięcia konta
//   - Wyświetlenia informacji o koncie (email)
// Middleware: Wymagane uwierzytelnienie
// Komponenty: ChangePasswordForm, DeleteAccountDialog
```

### 2.2. Modyfikacja layoutu głównego

#### 2.2.1. Layout.astro - rozszerzenie

**Nowy komponent nawigacji w layoucie:**

```astro
<!-- src/layouts/Layout.astro -->
---
import "../styles/global.css";
import { ToasterProvider } from "../components/ToasterProvider";
import { Navigation } from "../components/Navigation";

interface Props {
  title?: string;
  requireAuth?: boolean; // Flaga czy strona wymaga autentykacji
}

const { title = "EduKids", requireAuth = true } = Astro.props;

// Pobierz użytkownika z session (jeśli istnieje)
const supabase = Astro.locals.supabase;
const { data: { user } } = await supabase.auth.getUser();

// Przekierowanie jeśli strona wymaga auth a użytkownik niezalogowany
if (requireAuth && !user) {
  return Astro.redirect('/login');
}

// Przekierowanie jeśli strona publiczna a użytkownik zalogowany
// (np. /login, /register gdy user już zalogowany)
if (!requireAuth && user && ['/login', '/register'].includes(Astro.url.pathname)) {
  return Astro.redirect('/topics');
}
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    <!-- Nawigacja wyświetlana tylko dla zalogowanych użytkowników -->
    {user && <Navigation client:load user={user} />}
    
    <slot />
    <ToasterProvider client:load />
  </body>
</html>
```

**Kontrakt komponentu Navigation (React):**

```typescript
// src/components/Navigation.tsx
interface NavigationProps {
  user: {
    email: string;
    id: string;
  };
}

// Funkcjonalność:
// - Logo/nazwa aplikacji z linkiem do /topics
// - Menu główne: Tematy (/topics), Generuj pytania (/generate)
// - Dropdown w prawym górnym rogu z:
//   - Email użytkownika
//   - Link do Ustawień konta (/settings)
//   - Przycisk Wyloguj (wywołanie POST /api/auth/logout)
```

### 2.3. Komponenty React dla formularzy autentykacji

#### 2.3.1. LoginForm (`src/components/auth/LoginForm.tsx`)

**Odpowiedzialność:**
- Renderowanie formularza logowania (email, hasło)
- Walidacja kliencka (email format, minimalna długość hasła)
- Wyświetlanie błędów walidacji inline
- Wysyłanie POST do `/api/auth/login`
- Obsługa stanów ładowania i błędów API
- Przekierowanie po sukcesie do `/topics`
- Linki pomocnicze: "Nie masz konta?" → `/register`, "Zapomniałeś hasła?" → `/forgot-password`

**Kontrakt danych:**
```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormState {
  data: LoginFormData;
  errors: {
    email?: string;
    password?: string;
    form?: string; // Błąd ogólny z API
  };
  isSubmitting: boolean;
}
```

**Walidacja kliencka:**
- Email: wymagany, poprawny format email
- Hasło: wymagane, min. 6 znaków

**Komunikaty błędów:**
- Błąd walidacji email: "Podaj poprawny adres email"
- Błąd walidacji hasła: "Hasło musi mieć co najmniej 6 znaków"
- Błąd 401 z API: "Nieprawidłowy email lub hasło"
- Błąd 429 z API: "Zbyt wiele prób logowania. Spróbuj ponownie później"
- Błąd 500 z API: "Wystąpił błąd serwera. Spróbuj ponownie"
- Błąd sieciowy: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie"

#### 2.3.2. RegisterForm (`src/components/auth/RegisterForm.tsx`)

**Odpowiedzialność:**
- Renderowanie formularza rejestracji (email, hasło, potwierdzenie hasła)
- Walidacja kliencka rozszerzona o zgodność haseł
- Wysyłanie POST do `/api/auth/register`
- Wyświetlanie komunikatu o konieczności potwierdzenia emaila
- Przekierowanie po sukcesie do `/login` z komunikatem

**Kontrakt danych:**
```typescript
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormState {
  data: RegisterFormData;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  };
  isSubmitting: boolean;
  success: boolean; // Czy rejestracja zakończona sukcesem
}
```

**Walidacja kliencka:**
- Email: wymagany, poprawny format
- Hasło: wymagane, min. 8 znaków, zawiera wielką literę, małą literę, cyfrę
- Potwierdzenie hasła: musi być identyczne jak hasło

**Komunikaty błędów:**
- Email zajęty (409): "Ten adres email jest już zarejestrowany"
- Słabe hasło: "Hasło musi zawierać co najmniej 8 znaków, wielką literę, małą literę i cyfrę"
- Niezgodne hasła: "Hasła nie są identyczne"
- Sukces: "Konto utworzone! Sprawdź email, aby potwierdzić rejestrację"

#### 2.3.3. ForgotPasswordForm (`src/components/auth/ForgotPasswordForm.tsx`)

**Odpowiedzialność:**
- Formularz z polem email
- Wysyłanie POST do `/api/auth/forgot-password`
- Wyświetlanie komunikatu o wysłaniu linku (niezależnie czy email istnieje - bezpieczeństwo)

**Kontrakt danych:**
```typescript
interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormState {
  data: ForgotPasswordFormData;
  errors: {
    email?: string;
    form?: string;
  };
  isSubmitting: boolean;
  success: boolean;
}
```

**Komunikaty:**
- Sukces: "Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła"

#### 2.3.4. ResetPasswordForm (`src/components/auth/ResetPasswordForm.tsx`)

**Odpowiedzialność:**
- Formularz z nowymi hasłami (hasło, potwierdzenie)
- Walidacja tokenów z URL
- Wysyłanie POST do `/api/auth/reset-password` z tokenem
- Przekierowanie do `/login` po sukcesie

**Kontrakt danych:**
```typescript
interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormState {
  data: ResetPasswordFormData;
  errors: {
    password?: string;
    confirmPassword?: string;
    form?: string;
  };
  isSubmitting: boolean;
  tokenValid: boolean; // Czy token z URL jest ważny
}
```

**Komunikaty błędów:**
- Token nieprawidłowy/wygasły: "Link resetowania hasła jest nieprawidłowy lub wygasł. Poproś o nowy"
- Sukces: "Hasło zmienione pomyślnie. Możesz się teraz zalogować"

#### 2.3.5. ChangePasswordForm (`src/components/auth/ChangePasswordForm.tsx`)

**Odpowiedzialność:**
- Formularz na stronie /settings
- Pola: stare hasło, nowe hasło, potwierdzenie nowego hasła
- Wysyłanie POST do `/api/auth/change-password`
- Wyświetlanie komunikatu sukcesu

**Kontrakt danych:**
```typescript
interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormState {
  data: ChangePasswordFormData;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    form?: string;
  };
  isSubmitting: boolean;
  success: boolean;
}
```

**Komunikaty błędów:**
- Błędne stare hasło: "Aktualne hasło jest nieprawidłowe"
- Sukces: "Hasło zostało zmienione pomyślnie"

#### 2.3.6. DeleteAccountDialog (`src/components/auth/DeleteAccountDialog.tsx`)

**Odpowiedzialność:**
- Dialog potwierdzenia usunięcia konta
- Wymaga ponownego wprowadzenia hasła jako potwierdzenie
- Wysyłanie DELETE do `/api/auth/account`
- Przekierowanie do strony głównej po usunięciu

**Kontrakt danych:**
```typescript
interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

interface DeleteAccountDialogState {
  password: string;
  errors: {
    password?: string;
    form?: string;
  };
  isDeleting: boolean;
}
```

**Komunikaty:**
- Ostrzeżenie: "To działanie jest nieodwracalne. Wszystkie Twoje dane zostaną trwale usunięte."
- Błąd hasła: "Hasło jest nieprawidłowe"
- Sukces: Przekierowanie do `/` z toast "Konto zostało usunięte"

### 2.4. Komponenty współdzielone (Shared)

#### 2.4.1. AuthFormContainer (`src/components/auth/AuthFormContainer.tsx`)

**Odpowiedzialność:**
- Wrapper dla wszystkich formularzy autentykacji
- Spójny layout (centrowane, z logo, card z cieniem)
- Responsywność

#### 2.4.2. FormField (`src/components/auth/FormField.tsx`)

**Odpowiedzialność:**
- Renderowanie pojedynczego pola formularza (input + label + error)
- Typy: text, email, password
- Ikony dla pól (np. ikona oka do toggle visibility dla hasła)

#### 2.4.3. AuthErrorAlert (`src/components/auth/AuthErrorAlert.tsx`)

**Odpowiedzialność:**
- Wyświetlanie błędów formularza w spójny sposób
- Warianty: error, warning, info, success

### 2.5. Flow użytkownika - scenariusze kluczowe

#### Scenariusz 1: Rejestracja i pierwsze logowanie
1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, hasło, potwierdzenie)
3. Kliknięcie "Zarejestruj się" → POST `/api/auth/register`
4. Supabase wysyła email potwierdzający
5. Wyświetlenie komunikatu: "Sprawdź email..."
6. Użytkownik klika link w emailu → Supabase potwierdza email
7. Przekierowanie do `/login`
8. Logowanie → POST `/api/auth/login`
9. Ustawienie ciasteczka sesji
10. Przekierowanie do `/topics`

#### Scenariusz 2: Zapomniałem hasła
1. Użytkownik na `/login` klika "Zapomniałeś hasła?"
2. Przekierowanie do `/forgot-password`
3. Podaje email → POST `/api/auth/forgot-password`
4. Supabase wysyła email z linkiem resetującym
5. Wyświetlenie: "Link został wysłany..."
6. Użytkownik klika link → `/reset-password?token=...`
7. Formularz nowego hasła → POST `/api/auth/reset-password`
8. Supabase resetuje hasło
9. Przekierowanie do `/login` z komunikatem sukcesu

#### Scenariusz 3: Zmiana hasła (zalogowany)
1. Użytkownik zalogowany → `/settings`
2. Sekcja "Zmień hasło"
3. Formularz: stare hasło, nowe hasło, potwierdzenie
4. Kliknięcie "Zmień hasło" → POST `/api/auth/change-password`
5. Supabase weryfikuje stare hasło i ustawia nowe
6. Komunikat sukcesu, user pozostaje zalogowany

#### Scenariusz 4: Usunięcie konta
1. Użytkownik zalogowany → `/settings`
2. Przycisk "Usuń konto" (czerwony, na dole)
3. Otwarcie dialogu z ostrzeżeniem
4. Wpisanie hasła dla potwierdzenia
5. Kliknięcie "Tak, usuń moje konto" → DELETE `/api/auth/account`
6. Backend usuwa wszystkie dane użytkownika (CASCADE w DB)
7. Wylogowanie i przekierowanie do `/`

#### Scenariusz 5: Próba dostępu do chronionej strony bez logowania
1. Użytkownik niezalogowany próbuje wejść na `/topics`
2. Middleware sprawdza sesję → brak
3. Przekierowanie do `/login?redirect=/topics`
4. Po zalogowaniu → przekierowanie do oryginalnego URL (`/topics`)

---

## 3. LOGIKA BACKENDOWA

### 3.1. Struktura endpointów API

Wszystkie endpointy autentykacji w katalogu: `src/pages/api/auth/`

#### 3.1.1. POST /api/auth/register

**Opis:** Rejestracja nowego użytkownika

**Request Body:**
```typescript
{
  email: string;      // Format: email, wymagane
  password: string;   // Min 8 znaków, wymagane
}
```

**Walidacja (Zod schema):**
```typescript
// src/lib/validators/auth.validators.ts
export const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
});
```

**Logika:**
1. Walidacja body za pomocą Zod
2. Wywołanie `AuthService.register(email, password)`
3. Supabase tworzy użytkownika i wysyła email potwierdzający
4. Zwrot sukcesu (201)

**Response:**
```typescript
// 201 Created
{
  message: "Konto utworzone. Sprawdź email aby potwierdzić rejestrację."
}

// 400 Bad Request (walidacja)
{
  error: "Validation error",
  details: [
    { field: "password", message: "Hasło musi mieć co najmniej 8 znaków" }
  ]
}

// 409 Conflict (email już istnieje)
{
  error: "User already exists",
  message: "Ten adres email jest już zarejestrowany"
}

// 500 Internal Server Error
{
  error: "Internal server error",
  message: "Nie udało się utworzyć konta. Spróbuj ponownie."
}
```

#### 3.1.2. POST /api/auth/login

**Opis:** Logowanie użytkownika

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Walidacja:**
```typescript
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

**Logika:**
1. Walidacja body
2. Wywołanie `AuthService.login(email, password)`
3. Supabase zwraca session (access token + refresh token)
4. Ustawienie ciasteczka HTTP-only z session
5. Zwrot sukcesu (200)

**Response:**
```typescript
// 200 OK
{
  message: "Zalogowano pomyślnie",
  user: {
    id: string;
    email: string;
  }
}

// 401 Unauthorized (błędne dane)
{
  error: "Invalid credentials",
  message: "Nieprawidłowy email lub hasło"
}

// 403 Forbidden (email nie potwierdzony)
{
  error: "Email not confirmed",
  message: "Potwierdź swój adres email aby się zalogować"
}
```

**Ciasteczko:**
```
sb-access-token: <JWT>
HttpOnly: true
Secure: true (tylko HTTPS w produkcji)
SameSite: Lax
Path: /
Max-Age: 3600 (1h)

sb-refresh-token: <JWT>
HttpOnly: true
Secure: true
SameSite: Lax
Path: /
Max-Age: 604800 (7 dni)
```

#### 3.1.3. POST /api/auth/logout

**Opis:** Wylogowanie użytkownika

**Authorization:** Wymagane (session cookie)

**Request Body:** Brak

**Logika:**
1. Pobranie sesji z cookies
2. Wywołanie `AuthService.logout()`
3. Supabase unieważnia sesję
4. Usunięcie ciasteczek sesji
5. Zwrot sukcesu (200)

**Response:**
```typescript
// 200 OK
{
  message: "Wylogowano pomyślnie"
}
```

#### 3.1.4. POST /api/auth/forgot-password

**Opis:** Wysłanie linku resetującego hasło

**Request Body:**
```typescript
{
  email: string;
}
```

**Walidacja:**
```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});
```

**Logika:**
1. Walidacja email
2. Wywołanie `AuthService.sendPasswordResetEmail(email)`
3. Supabase wysyła email z linkiem (zawiera token)
4. Zwrot sukcesu zawsze (bezpieczeństwo - nie ujawniamy czy email istnieje)

**Response:**
```typescript
// 200 OK (zawsze, niezależnie czy email istnieje)
{
  message: "Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła"
}
```

**Link w emailu:**
```
https://edukids.pl/reset-password?token=<TOKEN>&type=recovery
```

#### 3.1.5. POST /api/auth/reset-password

**Opis:** Resetowanie hasła za pomocą tokenu z emaila

**Request Body:**
```typescript
{
  token: string;      // Token z URL emaila
  password: string;   // Nowe hasło
}
```

**Walidacja:**
```typescript
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
});
```

**Logika:**
1. Walidacja body
2. Wywołanie `AuthService.resetPassword(token, password)`
3. Supabase weryfikuje token i resetuje hasło
4. Zwrot sukcesu (200)

**Response:**
```typescript
// 200 OK
{
  message: "Hasło zostało zmienione pomyślnie"
}

// 400 Bad Request (token nieprawidłowy/wygasły)
{
  error: "Invalid token",
  message: "Link resetowania hasła jest nieprawidłowy lub wygasł"
}
```

#### 3.1.6. POST /api/auth/change-password

**Opis:** Zmiana hasła dla zalogowanego użytkownika

**Authorization:** Wymagane (session cookie)

**Request Body:**
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Walidacja:**
```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
  newPassword: z.string()
    .min(8, "Nowe hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
});
```

**Logika:**
1. Weryfikacja sesji (middleware)
2. Walidacja body
3. Wywołanie `AuthService.changePassword(user, currentPassword, newPassword)`
4. Supabase weryfikuje stare hasło i ustawia nowe
5. Sesja pozostaje aktywna (nie wylogowujemy)
6. Zwrot sukcesu (200)

**Response:**
```typescript
// 200 OK
{
  message: "Hasło zostało zmienione pomyślnie"
}

// 401 Unauthorized (złe aktualne hasło)
{
  error: "Invalid password",
  message: "Aktualne hasło jest nieprawidłowe"
}

// 403 Forbidden (brak sesji)
{
  error: "Unauthorized",
  message: "Musisz być zalogowany aby zmienić hasło"
}
```

#### 3.1.7. DELETE /api/auth/account

**Opis:** Usunięcie konta użytkownika wraz ze wszystkimi danymi

**Authorization:** Wymagane (session cookie)

**Request Body:**
```typescript
{
  password: string;  // Potwierdzenie hasła
}
```

**Walidacja:**
```typescript
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane do potwierdzenia"),
});
```

**Logika:**
1. Weryfikacja sesji
2. Walidacja body
3. Weryfikacja hasła
4. Wywołanie `AuthService.deleteAccount(user, password)`
5. Usunięcie użytkownika z Supabase Auth (CASCADE usuwa wszystkie powiązane dane z tabel)
6. Wylogowanie (usunięcie ciasteczek)
7. Zwrot sukcesu (200)

**Response:**
```typescript
// 200 OK
{
  message: "Konto zostało usunięte"
}

// 401 Unauthorized (złe hasło)
{
  error: "Invalid password",
  message: "Hasło jest nieprawidłowe"
}
```

### 3.2. Serwis autentykacji

#### AuthService (`src/lib/services/auth.service.ts`)

**Odpowiedzialność:**
- Enkapsulacja logiki autentykacji
- Interakcja z Supabase Auth API
- Obsługa błędów Supabase i mapowanie na błędy aplikacji

**Interfejs:**
```typescript
export class AuthService {
  constructor(private supabase: SupabaseClient<Database>);
  
  /**
   * Rejestracja nowego użytkownika
   * @throws AuthError jeśli email już istnieje lub inne błędy
   */
  async register(email: string, password: string): Promise<void>;
  
  /**
   * Logowanie użytkownika
   * @returns Session object z Supabase
   * @throws AuthError jeśli dane nieprawidłowe
   */
  async login(email: string, password: string): Promise<Session>;
  
  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void>;
  
  /**
   * Wysłanie emaila z linkiem resetującym hasło
   */
  async sendPasswordResetEmail(email: string): Promise<void>;
  
  /**
   * Resetowanie hasła za pomocą tokenu
   * @throws AuthError jeśli token nieprawidłowy
   */
  async resetPassword(token: string, newPassword: string): Promise<void>;
  
  /**
   * Zmiana hasła dla zalogowanego użytkownika
   * @throws AuthError jeśli stare hasło nieprawidłowe
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
  
  /**
   * Usunięcie konta użytkownika
   * @throws AuthError jeśli hasło nieprawidłowe
   */
  async deleteAccount(userId: string, password: string): Promise<void>;
  
  /**
   * Pobranie aktualnie zalogowanego użytkownika
   * @returns User object lub null
   */
  async getCurrentUser(): Promise<User | null>;
}
```

**Mapowanie błędów Supabase:**
```typescript
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// Przykłady:
// "auth/user-not-found" → 404
// "auth/wrong-password" → 401
// "auth/email-already-in-use" → 409
// "auth/weak-password" → 400
```

### 3.3. Walidatory (Zod schemas)

**Lokalizacja:** `src/lib/validators/auth.validators.ts`

**Wszystkie schematy:**
```typescript
import { z } from "zod";

// Wspólne reguły
const emailRule = z.string().email("Nieprawidłowy format email");
const passwordRule = z.string()
  .min(8, "Hasło musi mieć co najmniej 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
  .regex(/[a-z]/, "Hasło musi zawierać małą literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

export const registerSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token jest wymagany"),
  password: passwordRule,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
  newPassword: passwordRule,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Typy wejściowe z schematów
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
```

### 3.4. Typy i kontrakty API

**Rozszerzenie `src/types.ts`:**

```typescript
// ============================================================================
// Auth DTOs
// ============================================================================

/**
 * User data returned from auth endpoints
 */
export interface UserDto {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
}

/**
 * Auth response for login
 */
export interface AuthResponseDto {
  message: string;
  user: UserDto;
}

/**
 * Generic auth success response
 */
export interface AuthSuccessDto {
  message: string;
}

/**
 * Auth error response
 */
export interface AuthErrorDto {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
```

### 3.5. Aktualizacja istniejących endpointów

Wszystkie istniejące endpointy API wymagają aktualizacji:

**Przed:**
```typescript
// src/pages/api/topics/index.ts
export const GET: APIRoute = async ({ locals }) => {
  const userId = DEFAULT_USER_ID; // Tymczasowe rozwiązanie
  // ...
};
```

**Po:**
```typescript
// src/pages/api/topics/index.ts
export const GET: APIRoute = async ({ locals }) => {
  // Middleware gwarantuje że user istnieje dla chronionych endpoint'ów
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany"
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  const userId = user.id;
  const topicsService = new TopicsService(locals.supabase);
  const topics = await topicsService.getTopics(userId);
  // ...
};
```

**Lista endpointów do aktualizacji:**
- `GET /api/topics`
- `POST /api/topics`
- `GET /api/topics/[id]`
- `PUT /api/topics/[id]`
- `DELETE /api/topics/[id]`
- `POST /api/questions/generate`
- Wszystkie inne istniejące endpointy

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Supabase Auth - konfiguracja

#### 4.1.1. Konfiguracja Supabase Dashboard

**Email Templates:**
Należy skonfigurować w Supabase Dashboard → Authentication → Email Templates:

1. **Confirm signup** (Potwierdzenie rejestracji)
   - Temat: "Potwierdź swój adres email - EduKids"
   - Link: `{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup`

2. **Reset password** (Reset hasła)
   - Temat: "Zresetuj swoje hasło - EduKids"
   - Link: `{{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery`

3. **Change email** (Zmiana emaila - opcjonalnie na przyszłość)

**Auth Settings:**
- Enable Email provider: ✓
- Confirm email: ✓ (wymagane potwierdzenie emaila)
- Disable signup: ✗ (rejestracja włączona)
- Site URL: `https://edukids.pl` (produkcja) lub `http://localhost:3000` (dev)
- Redirect URLs: `https://edukids.pl/**` oraz `http://localhost:3000/**`

**Password Requirements (zgodne z walidacją):**
- Minimum length: 8
- Require uppercase: ✓
- Require lowercase: ✓
- Require numbers: ✓
- Require special characters: ✗ (opcjonalnie)

#### 4.1.2. Konfiguracja klienta Supabase

**Aktualizacja `src/db/supabase.client.ts`:**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase client for server-side operations
 * Uses anon key which respects RLS policies
 */
export const supabaseClient = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Najnowszy zalecany flow
    }
  }
);

/**
 * @deprecated Usunąć po implementacji auth
 * Tymczasowy ID dla deweloperów przed wdrożeniem auth
 */
export const DEFAULT_USER_ID = "033c5b19-26c7-44d0-b220-3593b1806149";

export type SupabaseClient = typeof supabaseClient;
```

**Zmienne środowiskowe (`.env`):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 4.2. Astro Middleware - autoryzacja i sesje

#### 4.2.1. Middleware główny

**Aktualizacja `src/middleware/index.ts`:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";
import type { User } from "@supabase/supabase-js";

/**
 * Lista ścieżek publicznych (dostępne bez logowania)
 */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm", // Endpoint callback dla potwierdzenia emaila
];

/**
 * Lista ścieżek API publicznych
 */
const PUBLIC_API_PATHS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

/**
 * Sprawdza czy ścieżka jest publiczna
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path)) ||
         PUBLIC_API_PATHS.some(path => pathname.startsWith(path)) ||
         pathname.startsWith("/_") || // Astro internal
         pathname.includes("."); // Static files
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, locals } = context;
  const pathname = new URL(request.url).pathname;
  
  // 1. Inicjalizacja klienta Supabase w locals
  locals.supabase = supabaseClient;
  
  // 2. Pobranie sesji z cookies
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;
  
  let user: User | null = null;
  
  if (accessToken && refreshToken) {
    // Ustaw session w kliencie Supabase
    const { data: { session }, error } = await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if (session && !error) {
      user = session.user;
      
      // Jeśli token został odświeżony, zaktualizuj cookies
      if (session.access_token !== accessToken) {
        cookies.set("sb-access-token", session.access_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60, // 1h
        });
      }
      
      if (session.refresh_token !== refreshToken) {
        cookies.set("sb-refresh-token", session.refresh_token, {
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    } else {
      // Token wygasł lub nieprawidłowy - usuń cookies
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });
    }
  }
  
  // 3. Zapisz user w locals (dostępne w endpointach i stronach)
  locals.user = user;
  
  // 4. Logika przekierowań
  const isPublic = isPublicPath(pathname);
  
  if (!isPublic && !user) {
    // Chroniona strona, brak logowania → redirect do /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return redirect(loginUrl.toString());
  }
  
  if (isPublic && user && ["/login", "/register"].includes(pathname)) {
    // User zalogowany próbuje wejść na /login lub /register → redirect
    return redirect("/topics");
  }
  
  // 5. Kontynuuj request
  return next();
});
```

#### 4.2.2. Rozszerzenie typów Astro locals

**Nowy plik: `src/middleware/types.ts`**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { User } from "@supabase/supabase-js";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
    }
  }
}

export {};
```

**Aktualizacja `src/env.d.ts`:**

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 4.3. Obsługa ciasteczek sesji

#### 4.3.1. Ustawianie ciasteczek po logowaniu

**W endpoincie `/api/auth/login`:**

```typescript
// Po sukcesie logowania
const { data, error } = await authService.login(email, password);

if (data.session) {
  // Ustaw access token
  context.cookies.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD, // HTTPS w produkcji
    sameSite: "lax",
    maxAge: 60 * 60, // 1 godzina
  });
  
  // Ustaw refresh token
  context.cookies.set("sb-refresh-token", data.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dni
  });
}
```

#### 4.3.2. Usuwanie ciasteczek po wylogowaniu

**W endpoincie `/api/auth/logout`:**

```typescript
// Wywołaj Supabase logout
await authService.logout();

// Usuń ciasteczka
context.cookies.delete("sb-access-token", { path: "/" });
context.cookies.delete("sb-refresh-token", { path: "/" });
```

### 4.4. Obsługa callback'ów Supabase

#### 4.4.1. Endpoint potwierdzenia emaila

**Nowy plik: `src/pages/auth/confirm.astro`**

```astro
---
/**
 * Auth Callback - Email Confirmation
 * 
 * Obsługuje callback po kliknięciu linku potwierdzającego email
 * Query params: token, type=signup
 */

const { searchParams } = Astro.url;
const token = searchParams.get("token");
const type = searchParams.get("type");

if (!token || type !== "signup") {
  return Astro.redirect("/login?error=invalid_link");
}

// Supabase automatycznie obsługuje potwierdzenie gdy user
// jest przekierowany z linku w emailu - wystarczy ustawić session
const supabase = Astro.locals.supabase;
const { error } = await supabase.auth.verifyOtp({
  token_hash: token,
  type: "signup",
});

if (error) {
  return Astro.redirect("/login?error=confirmation_failed");
}

// Sukces - przekierowanie do logowania z komunikatem
return Astro.redirect("/login?confirmed=true");
---
```

#### 4.4.2. Callback dla resetowania hasła

Obsługiwany przez stronę `/reset-password` - token przekazany w URL jako query param.

### 4.5. Row Level Security (RLS) - integracja

RLS policies są już skonfigurowane w migracji `20251026120000_initial_schema.sql`. 

**Kluczowe punkty:**
- Wszystkie tabele mają włączony RLS
- Policies używają `auth.uid()` do identyfikacji użytkownika
- Supabase client automatycznie przekazuje `user_id` z JWT do `auth.uid()`
- **Nie trzeba ręcznie podawać user_id w zapytaniach** - Supabase sam filtruje dane

**Przykład działania RLS:**

```typescript
// Backend - topics.service.ts
async getTopics(userId: string): Promise<TopicDto[]> {
  // Mimo że przekazujemy userId, Supabase dodatkowo weryfikuje
  // czy auth.uid() z JWT == userId z query
  const { data, error } = await this.supabase
    .from("topics")
    .select("*")
    .eq("user_id", userId);  // Ta linia jest opcjonalna z RLS
    
  // RLS automatycznie doda: WHERE user_id = auth.uid()
  // Więc nawet jeśli ktoś podmieni userId, nie zobaczy cudzych danych
}
```

**Dodatkowe zabezpieczenie w serwisach:**
Mimo RLS, warto explicite przekazywać `user_id` dla przejrzystości kodu i jako defense-in-depth.

### 4.6. Obsługa błędów i edge cases

#### 4.6.1. Email już zarejestrowany

```typescript
// W AuthService.register()
const { error } = await this.supabase.auth.signUp({ email, password });

if (error) {
  if (error.message.includes("already registered")) {
    throw new AuthError(
      "USER_EXISTS",
      "Ten adres email jest już zarejestrowany",
      409
    );
  }
  throw error;
}
```

#### 4.6.2. Rate limiting

Supabase ma wbudowany rate limiting dla auth endpointów. W przypadku przekroczenia:

```typescript
// Endpoint zwraca 429 Too Many Requests
{
  error: "Too many requests",
  message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut"
}
```

#### 4.6.3. Wygasła sesja

Middleware automatycznie próbuje odświeżyć token za pomocą refresh token. Jeśli nie uda się:
- Usunięcie ciasteczek
- Przekierowanie do `/login`

#### 4.6.4. Email nie potwierdzony

```typescript
// W AuthService.login()
const { data, error } = await this.supabase.auth.signInWithPassword({
  email,
  password,
});

if (error && error.message.includes("Email not confirmed")) {
  throw new AuthError(
    "EMAIL_NOT_CONFIRMED",
    "Potwierdź swój adres email aby się zalogować",
    403
  );
}
```

---

## 5. MIGRACJE BAZY DANYCH

### 5.1. Tabele użytkowników

Supabase automatycznie zarządza tabelą `auth.users` - **nie trzeba tworzyć własnej**.

**Struktura tabeli `auth.users` (zarządzana przez Supabase):**
```sql
-- Automatycznie dostępne kolumny:
id UUID PRIMARY KEY
email VARCHAR UNIQUE
encrypted_password VARCHAR
email_confirmed_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
-- ... inne metadata
```

### 5.2. Aktualizacja istniejących tabel

Istniejące tabele już mają kolumny `user_id UUID` z kluczem obcym do `auth.users(id)`.

**Weryfikacja relacji (istniejące migracje są poprawne):**

```sql
-- topics.user_id -> auth.users.id (CASCADE)
-- questions.user_id -> auth.users.id (CASCADE)
-- question_sets.user_id -> auth.users.id (CASCADE)
```

**Efekt CASCADE:** Po usunięciu użytkownika (DELETE from auth.users):
- Automatycznie usuwane są wszystkie jego topics
- Automatycznie usuwane są wszystkie jego questions
- Automatycznie usuwane są wszystkie jego question_sets
- Automatycznie usuwane są wszystkie powiązane question_set_items (via CASCADE z question_sets)

### 5.3. Dodatkowa migracja - testy użytkownika

**Nowa migracja: `supabase/migrations/20251122000000_add_test_user.sql`**

```sql
-- Migration: Add test user for development
-- Purpose: Insert test user into auth.users for local development
-- Only for development - skip in production

-- Sprawdź czy to środowisko deweloperskie
-- W produkcji ta migracja nie powinna się wykonać

-- Dodaj testowego użytkownika (hasło: Test1234)
-- Ten user ma ID: 033c5b19-26c7-44d0-b220-3593b1806149
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '033c5b19-26c7-44d0-b220-3593b1806149'::uuid,
  'test@edukids.pl',
  crypt('Test1234', gen_salt('bf')), -- Supabase używa bcrypt
  now(),
  now(),
  now(),
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Dodaj identity dla tego użytkownika (wymagane przez Supabase Auth)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
) VALUES (
  '033c5b19-26c7-44d0-b220-3593b1806149'::uuid,
  '033c5b19-26c7-44d0-b220-3593b1806149'::uuid,
  jsonb_build_object('sub', '033c5b19-26c7-44d0-b220-3593b1806149', 'email', 'test@edukids.pl'),
  'email',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
```

**Uwaga:** W produkcji tę migrację należy pominąć lub użyć warunku sprawdzającego środowisko.

---

## 6. TESTOWANIE I WALIDACJA

### 6.1. Plan testów funkcjonalnych

#### Test 1: Rejestracja nowego użytkownika
1. Wejść na `/register`
2. Wypełnić formularz (email, hasło silne, potwierdzenie)
3. Kliknąć "Zarejestruj się"
4. Oczekiwany rezultat: Komunikat "Sprawdź email...", email wysłany
5. Kliknąć link w emailu
6. Oczekiwany rezultat: Przekierowanie do `/login?confirmed=true`

#### Test 2: Logowanie
1. Wejść na `/login`
2. Wprowadzić dane testowego użytkownika
3. Kliknąć "Zaloguj"
4. Oczekiwany rezultat: Przekierowanie do `/topics`, widoczna nawigacja z emailem użytkownika

#### Test 3: Próba dostępu bez logowania
1. Wylogować się
2. Próbować wejść na `/topics`
3. Oczekiwany rezultat: Przekierowanie do `/login?redirect=/topics`
4. Po zalogowaniu: Automatyczne przekierowanie do `/topics`

#### Test 4: Reset hasła
1. Na `/login` kliknąć "Zapomniałeś hasła?"
2. Wprowadzić email
3. Kliknąć "Wyślij link"
4. Oczekiwany rezultat: Komunikat o wysłaniu linku
5. Kliknąć link w emailu
6. Wprowadzić nowe hasło
7. Oczekiwany rezultat: Komunikat sukcesu, przekierowanie do `/login`
8. Zalogować się z nowym hasłem

#### Test 5: Zmiana hasła
1. Zalogować się
2. Przejść do `/settings`
3. Sekcja "Zmień hasło"
4. Wprowadzić stare i nowe hasło
5. Kliknąć "Zmień hasło"
6. Oczekiwany rezultat: Komunikat sukcesu, user nadal zalogowany

#### Test 6: Usunięcie konta
1. Zalogować się
2. Przejść do `/settings`
3. Kliknąć "Usuń konto"
4. W dialogu wprowadzić hasło
5. Kliknąć "Tak, usuń moje konto"
6. Oczekiwany rezultat: Konto usunięte, wszystkie dane użytkownika usunięte (topics, questions), wylogowanie, przekierowanie do `/`

### 6.2. Testy API (przykłady)

**Test POST /api/auth/register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.pl","password":"SecurePass123"}'

# Oczekiwany: 201 Created
```

**Test POST /api/auth/login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@edukids.pl","password":"Test1234"}' \
  -c cookies.txt

# Oczekiwany: 200 OK + ciasteczka w cookies.txt
```

**Test GET /api/topics (z autentykacją):**
```bash
curl -X GET http://localhost:3000/api/topics \
  -b cookies.txt

# Oczekiwany: 200 OK + lista topics użytkownika
```

**Test GET /api/topics (bez autentykacji):**
```bash
curl -X GET http://localhost:3000/api/topics

# Oczekiwany: 401 Unauthorized
```

### 6.3. Testy bezpieczeństwa

#### Test 1: RLS - próba dostępu do cudzych danych
1. Zalogować się jako User A
2. Utworzyć topic
3. Zanotować ID topica
4. Zalogować się jako User B
5. Próbować GET `/api/topics/{id_topica_usera_A}`
6. Oczekiwany rezultat: 404 Not Found (RLS blokuje dostęp)

#### Test 2: Expired token
1. Zalogować się
2. Ręcznie zmienić timestamp w JWT (cookies)
3. Próbować GET `/api/topics`
4. Oczekiwany rezultat: Przekierowanie do `/login`

#### Test 3: CSRF protection
Supabase ciasteczka z `sameSite: "lax"` zapewniają podstawową ochronę przed CSRF.

---

## 7. CHECKLIST IMPLEMENTACJI

### Faza 1: Backend - Auth API i serwisy
- [ ] Utworzyć `src/lib/services/auth.service.ts` z klasą `AuthService`
- [ ] Utworzyć `src/lib/validators/auth.validators.ts` z wszystkimi schematami Zod
- [ ] Utworzyć endpoint `POST /api/auth/register`
- [ ] Utworzyć endpoint `POST /api/auth/login`
- [ ] Utworzyć endpoint `POST /api/auth/logout`
- [ ] Utworzyć endpoint `POST /api/auth/forgot-password`
- [ ] Utworzyć endpoint `POST /api/auth/reset-password`
- [ ] Utworzyć endpoint `POST /api/auth/change-password`
- [ ] Utworzyć endpoint `DELETE /api/auth/account`
- [ ] Zaktualizować `src/types.ts` o typy auth (DTOs)
- [ ] Zaktualizować `src/db/supabase.client.ts` (konfiguracja auth)

### Faza 2: Middleware i routing
- [ ] Zaktualizować `src/middleware/index.ts` (autoryzacja, sesje, przekierowania)
- [ ] Utworzyć `src/middleware/types.ts` (rozszerzenie Astro.locals)
- [ ] Utworzyć `src/pages/auth/confirm.astro` (callback potwierdzenia emaila)
- [ ] Zaktualizować `src/env.d.ts` (typy)

### Faza 3: UI - strony publiczne
- [ ] Utworzyć `src/pages/login.astro`
- [ ] Utworzyć `src/pages/register.astro`
- [ ] Utworzyć `src/pages/forgot-password.astro`
- [ ] Utworzyć `src/pages/reset-password.astro`
- [ ] Utworzyć `src/pages/settings.astro`

### Faza 4: UI - komponenty React
- [ ] Utworzyć `src/components/auth/AuthFormContainer.tsx`
- [ ] Utworzyć `src/components/auth/FormField.tsx`
- [ ] Utworzyć `src/components/auth/AuthErrorAlert.tsx`
- [ ] Utworzyć `src/components/auth/LoginForm.tsx`
- [ ] Utworzyć `src/components/auth/RegisterForm.tsx`
- [ ] Utworzyć `src/components/auth/ForgotPasswordForm.tsx`
- [ ] Utworzyć `src/components/auth/ResetPasswordForm.tsx`
- [ ] Utworzyć `src/components/auth/ChangePasswordForm.tsx`
- [ ] Utworzyć `src/components/auth/DeleteAccountDialog.tsx`

### Faza 5: UI - nawigacja i layout
- [ ] Utworzyć `src/components/Navigation.tsx`
- [ ] Zaktualizować `src/layouts/Layout.astro` (dodać Navigation, logikę przekierowań)
- [ ] Zaktualizować `src/pages/index.astro` (sprawdzenie czy user zalogowany)

### Faza 6: Aktualizacja istniejącego kodu
- [ ] Zaktualizować wszystkie endpointy API (zamienić DEFAULT_USER_ID na locals.user.id)
- [ ] Zaktualizować `src/pages/api/topics/index.ts`
- [ ] Zaktualizować `src/pages/api/topics/[id].ts`
- [ ] Zaktualizować `src/pages/api/questions/generate.ts`
- [ ] Usunąć lub oznaczyć jako deprecated `DEFAULT_USER_ID` w `supabase.client.ts`

### Faza 7: Konfiguracja Supabase
- [ ] Skonfigurować Email Templates w Supabase Dashboard
- [ ] Skonfigurować Auth Settings (Site URL, Redirect URLs)
- [ ] Skonfigurować Password Requirements
- [ ] (Opcjonalnie) Dodać migrację z testowym użytkownikiem

### Faza 8: Testowanie
- [ ] Przetestować rejestrację (z potwierdzeniem emaila)
- [ ] Przetestować logowanie
- [ ] Przetestować wylogowanie
- [ ] Przetestować reset hasła
- [ ] Przetestować zmianę hasła
- [ ] Przetestować usunięcie konta
- [ ] Przetestować middleware (przekierowania dla niezalogowanych)
- [ ] Przetestować RLS (próba dostępu do cudzych danych)
- [ ] Przetestować wszystkie istniejące funkcjonalności (topics, questions) z prawdziwym userem

### Faza 9: Dokumentacja i cleanup
- [ ] Zaktualizować README.md (instrukcje uruchomienia z auth)
- [ ] Dodać przykładowe dane .env
- [ ] Usunąć kod tymczasowy (DEFAULT_USER_ID usage)
- [ ] Code review i refactoring

---

## 8. BEZPIECZEŃSTWO - BEST PRACTICES

### 8.1. Ochrona przed atakami

**CSRF (Cross-Site Request Forgery):**
- Ciasteczka z `sameSite: "lax"` (podstawowa ochrona)
- Rozważyć dodanie CSRF tokens dla krytycznych operacji (usunięcie konta)

**XSS (Cross-Site Scripting):**
- React automatycznie escape'uje dane (używamy JSX)
- Unikać `dangerouslySetInnerHTML`
- Content Security Policy (CSP headers) - rozważyć w produkcji

**SQL Injection:**
- Supabase używa prepared statements (automatyczna ochrona)
- Nie konstruujemy SQL ręcznie

**Brute Force:**
- Supabase ma wbudowany rate limiting
- Rozważyć dodanie captcha po N nieudanych próbach logowania

**Session Hijacking:**
- HttpOnly cookies (niedostępne dla JS)
- Secure cookies w produkcji (tylko HTTPS)
- Token rotation (Supabase automatycznie)

### 8.2. Walidacja i sanitizacja

**Backend (zawsze):**
- Zod schemas dla wszystkich inputów
- Walidacja formatu email
- Walidacja siły hasła (min 8 znaków, uppercase, lowercase, digit)

**Frontend (UX):**
- Walidacja kliencka dla szybkiej informacji zwrotnej
- Nie polegamy wyłącznie na walidacji klienckiej

### 8.3. Secrets management

**Zmienne środowiskowe:**
```bash
# .env (nie commitować do repo!)
SUPABASE_URL=...
SUPABASE_KEY=...  # Anon key (publiczny, ale z RLS)

# W produkcji używać secrets management (np. GitHub Secrets dla Actions)
```

**Service Role Key:**
- Nie używać w kodzie klienckim
- Tylko w zadaniach administracyjnych po stronie serwera
- Przechowywać oddzielnie od anon key

### 8.4. Logging i monitoring

**Co logować:**
- Nieudane próby logowania (do detekcji brute force)
- Zmiany hasła
- Usunięcia kont
- Błędy autentykacji (bez logowania haseł!)

**Czego NIE logować:**
- Hasła (plain text ani hashed)
- Tokenów JWT (pełnych)
- Danych osobowych niepotrzebnie

---

## 9. DEPLOYMENT I DEVOPS

### 9.1. Zmienne środowiskowe w produkcji

**GitHub Actions Secrets (przykład):**
```yaml
# .github/workflows/deploy.yml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

**DigitalOcean App Platform:**
- Skonfigurować environment variables w panelu
- Włączyć HTTPS (automatyczny certyfikat)

### 9.2. Konfiguracja domenowa

**Supabase Site URL:**
```
Development: http://localhost:3000
Production: https://edukids.pl
```

**Redirect URLs (whitelist):**
```
http://localhost:3000/**
https://edukids.pl/**
```

### 9.3. Email delivery

**Supabase SMTP:**
- Domyślnie Supabase używa własnego SMTP (limit ~3 emaile/h w free tier)
- W produkcji skonfigurować własny SMTP (SendGrid, AWS SES, Mailgun)

**Konfiguracja custom SMTP w Supabase:**
- Dashboard → Project Settings → Auth → SMTP Settings
- Podać credentials zewnętrznego providera

---

## 10. PRZYSZŁE ROZSZERZENIA (POZA MVP)

### 10.1. Możliwe ulepszenia

**OAuth providers:**
- Google Sign-In
- GitHub OAuth
- Łatwo dodać przez Supabase Dashboard → Auth → Providers

**Two-Factor Authentication (2FA):**
- Supabase wspiera TOTP (Time-based One-Time Password)
- Dodać w ustawieniach konta opcję włączenia 2FA

**Email verification reminder:**
- Wysyłanie przypomnienia o potwierdzeniu emaila po 24h/48h

**Password strength meter:**
- Biblioteka `zxcvbn` do oceny siły hasła w czasie rzeczywistym

**Account recovery bez emaila:**
- Pytania bezpieczeństwa (nie zalecane)
- Backup codes (lepsze rozwiązanie)

**Audit log:**
- Historia logowań użytkownika (IP, timestamp, device)
- Dostępne w ustawieniach konta

**Role-based access control (RBAC):**
- Obecnie: wszyscy użytkownicy mają te same uprawnienia
- Przyszłość: nauczyciel vs rodzic vs administrator

### 10.2. Optymalizacje wydajności

**Caching:**
- Cache user session w Redis (jeśli skala rośnie)
- Obecnie: Astro middleware sprawdza session przy każdym request (akceptowalne dla MVP)

**CDN:**
- Static assets (obrazki, CSS, JS) przez CDN
- Supabase Storage dla user-uploaded files (przyszłość)

---

## 11. PODSUMOWANIE

### 11.1. Kluczowe decyzje architektoniczne

1. **Supabase Auth jako fundament** - gotowe rozwiązanie, bezpieczne, skalowalne
2. **Session-based auth z HTTP-only cookies** - bezpieczne, kompatybilne z SSR Astro
3. **Astro middleware do autoryzacji** - centralizacja logiki, DRY principle
4. **Row Level Security (RLS)** - bezpieczeństwo na poziomie bazy danych, defense-in-depth
5. **React dla formularzy** - interaktywność tam gdzie potrzebna, Astro dla reszty
6. **Zod dla walidacji** - type-safe, jednolite schemas dla frontend i backend

### 11.2. Zgodność z wymaganiami PRD

| US ID | Wymaganie | Status implementacji |
|-------|-----------|---------------------|
| US-001 | Rejestracja email+hasło | ✅ Pełna implementacja |
| US-002 | Logowanie email+hasło | ✅ Pełna implementacja |
| US-003 | Zmiana hasła | ✅ Pełna implementacja |
| US-004 | Usunięcie konta | ✅ Pełna implementacja + CASCADE |
| US-013 | Bezpieczny dostęp + wymuszenie logowania | ✅ Middleware + layout |
| US-013 | Odzyskiwanie hasła | ✅ Forgot/Reset password flow |
| US-013 | Logout w prawym górnym rogu | ✅ Navigation component |

### 11.3. Nie-naruszenie istniejącej funkcjonalności

**Istniejące features pozostają kompatybilne:**
- Topics CRUD - dodanie `locals.user.id` zamiast `DEFAULT_USER_ID`
- Questions generation - dodanie autoryzacji
- Wszystkie komponenty React - bez zmian
- Routing - rozszerzony o nowe ścieżki auth
- Database schema - bez zmian (już ma user_id i RLS)

**Jedyna breaking change:**
- Usunięcie `DEFAULT_USER_ID` - wymagane prawdziwe logowanie

### 11.4. Metryki gotowości do produkcji

**Po implementacji tej specyfikacji, aplikacja będzie:**
- ✅ Bezpieczna - auth przez Supabase, RLS, HTTP-only cookies
- ✅ Skalowalna - Supabase obsługuje miliony użytkowników
- ✅ Zgodna z PRD - wszystkie wymagane US zaimplementowane
- ✅ User-friendly - jasne komunikaty, intuicyjny flow
- ✅ Testowalna - endpointy API, komponenty, flow użytkownika
- ⚠️ Gotowa do MVP - tak (z wyjątkiem custom SMTP dla emaili w skali)

---

## 12. ZAŁĄCZNIKI

### 12.1. Struktura katalogów (po implementacji)

```
src/
├── components/
│   ├── auth/                         # NOWE
│   │   ├── AuthFormContainer.tsx
│   │   ├── FormField.tsx
│   │   ├── AuthErrorAlert.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   ├── ChangePasswordForm.tsx
│   │   └── DeleteAccountDialog.tsx
│   ├── Navigation.tsx                # NOWE
│   ├── (pozostałe komponenty)
├── db/
│   ├── database.types.ts
│   └── supabase.client.ts            # AKTUALIZACJA
├── layouts/
│   └── Layout.astro                  # AKTUALIZACJA (+ Navigation)
├── lib/
│   ├── services/
│   │   ├── auth.service.ts           # NOWE
│   │   ├── topics.service.ts
│   │   └── questions.service.ts
│   ├── validators/
│   │   ├── auth.validators.ts        # NOWE
│   │   ├── topics.validators.ts
│   │   └── questions.validators.ts
│   └── utils.ts
├── middleware/
│   ├── index.ts                      # AKTUALIZACJA (autoryzacja)
│   └── types.ts                      # NOWE
├── pages/
│   ├── api/
│   │   ├── auth/                     # NOWE
│   │   │   ├── register.ts
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   ├── forgot-password.ts
│   │   │   ├── reset-password.ts
│   │   │   ├── change-password.ts
│   │   │   └── account.ts (DELETE)
│   │   ├── topics/
│   │   │   ├── index.ts              # AKTUALIZACJA (auth)
│   │   │   └── [id].ts               # AKTUALIZACJA (auth)
│   │   └── questions/
│   │       └── generate.ts           # AKTUALIZACJA (auth)
│   ├── auth/                         # NOWE
│   │   └── confirm.astro
│   ├── login.astro                   # NOWE
│   ├── register.astro                # NOWE
│   ├── forgot-password.astro         # NOWE
│   ├── reset-password.astro          # NOWE
│   ├── settings.astro                # NOWE
│   ├── index.astro                   # AKTUALIZACJA
│   ├── topics.astro                  # bez zmian
│   └── generate.astro                # bez zmian
├── types.ts                          # AKTUALIZACJA (+ auth DTOs)
└── env.d.ts                          # AKTUALIZACJA

supabase/
└── migrations/
    ├── 20251026120000_initial_schema.sql
    ├── 20251026120100_disable_rls_policies.sql
    ├── 20251108000000_disable_rls.sql
    └── 20251122000000_add_test_user.sql    # NOWE (opcjonalne)
```

### 12.2. Mapowanie PRD → Implementacja

**US-001: Rejestracja**
- Strona: `/register` → `src/pages/register.astro`
- Komponent: `RegisterForm.tsx`
- API: `POST /api/auth/register` → `src/pages/api/auth/register.ts`
- Serwis: `AuthService.register()`
- Walidacja: `registerSchema` (Zod)

**US-002: Logowanie**
- Strona: `/login` → `src/pages/login.astro`
- Komponent: `LoginForm.tsx`
- API: `POST /api/auth/login` → `src/pages/api/auth/login.ts`
- Serwis: `AuthService.login()`
- Middleware: Ustawienie ciasteczek sesji

**US-003: Zmiana hasła**
- Strona: `/settings` → `src/pages/settings.astro`
- Komponent: `ChangePasswordForm.tsx`
- API: `POST /api/auth/change-password`
- Serwis: `AuthService.changePassword()`

**US-004: Usunięcie konta**
- Strona: `/settings` → `src/pages/settings.astro`
- Komponent: `DeleteAccountDialog.tsx`
- API: `DELETE /api/auth/account`
- Serwis: `AuthService.deleteAccount()`
- Database: CASCADE delete (migracje)

**US-013: Bezpieczny dostęp**
- Middleware: `src/middleware/index.ts` (autoryzacja)
- Layout: `src/layouts/Layout.astro` (Navigation, przekierowania)
- Komponent: `Navigation.tsx` (logout button)
- Reset hasła: `/forgot-password`, `/reset-password`

### 12.3. Diagramy flow (tekstowe)

**Flow rejestracji:**
```
[User] → /register
       → RegisterForm (React)
       → POST /api/auth/register
       → AuthService.register()
       → Supabase Auth signUp()
       → Email wysłany
       → Komunikat "Sprawdź email"
       → [User] klika link w emailu
       → /auth/confirm?token=...
       → Supabase potwierdza email
       → Redirect /login?confirmed=true
```

**Flow logowania:**
```
[User] → /login
       → LoginForm (React)
       → POST /api/auth/login
       → AuthService.login()
       → Supabase Auth signInWithPassword()
       → Session zwrócona
       → Ustawienie cookies (access + refresh token)
       → Redirect /topics
       → Middleware pobiera user z cookies
       → locals.user ustawione
       → Navigation wyświetlana z emailem
```

**Flow ochrony zasobów:**
```
[User niezalogowany] → /topics
                     → Middleware: sprawdza locals.user
                     → locals.user === null
                     → Redirect /login?redirect=/topics
                     → [User loguje się]
                     → Redirect /topics (z query param)
```

---

**Koniec specyfikacji technicznej**

Dokument wersja: 1.0  
Data: 22.11.2025  
Autor: AI Assistant (Claude Sonnet 4.5)  
Status: Gotowe do implementacji

