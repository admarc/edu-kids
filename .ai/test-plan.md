# Plan Testów - EduKids

## 1. Wprowadzenie i cele testowania

### 1.1. Cel dokumentu
Niniejszy dokument określa kompleksową strategię testowania dla platformy EduKids - webowej aplikacji edukacyjnej umożliwiającej nauczycielom i rodzicom generowanie tematycznych zadań dla dzieci przy użyciu sztucznej inteligencji.

### 1.2. Cele testowania
- **Weryfikacja funkcjonalności**: Zapewnienie, że wszystkie funkcje MVP działają zgodnie z wymaganiami biznesowymi
- **Bezpieczeństwo**: Walidacja mechanizmów autentykacji, autoryzacji i ochrony danych użytkowników (RLS)
- **Integracja z usługami zewnętrznymi**: Weryfikacja poprawnej komunikacji z Supabase i OpenRouter.ai
- **Jakość kodu**: Wykrywanie błędów, regresji i problemów z wydajnością na wczesnym etapie
- **Doświadczenie użytkownika**: Zapewnienie intuicyjnego i responsywnego interfejsu
- **Stabilność**: Weryfikacja odporności systemu na błędy i nieprawidłowe dane wejściowe

### 1.3. Zakres MVP
Testowanie obejmuje następujące funkcjonalności MVP:
- System autentykacji (rejestracja, logowanie, zarządzanie hasłem, usuwanie konta)
- Zarządzanie tematami (CRUD)
- Generowanie pytań AI (do 10 pytań na sesję)
- Zarządzanie pytaniami (akceptacja, odrzucanie, edycja)
- Przeglądanie i filtrowanie pytań
- Obsługa błędów API z możliwością ponowienia

## 2. Zakres testów

### 2.1. W zakresie testów
- **Funkcjonalności podstawowe**:
  - Pełny przepływ autentykacji i autoryzacji
  - CRUD operacje na tematach i pytaniach
  - Generowanie pytań przez AI
  - Zarządzanie statusem pytań (pending, accepted, rejected)
  
- **Integracje**:
  - Komunikacja z bazą danych Supabase (PostgreSQL)
  - Autentykacja Supabase Auth
  - Wywołania API OpenRouter.ai
  - Row Level Security policies

- **Bezpieczeństwo**:
  - Walidacja danych wejściowych (Zod schemas)
  - Zabezpieczenia przed SQL Injection
  - Zabezpieczenia przed XSS
  - Ochrona CSRF
  - Weryfikacja tokenów JWT
  - RLS policies

- **Interfejs użytkownika**:
  - Formularze (walidacja, obsługa błędów)
  - Responsywność (mobile-first)
  - Dostępność (WCAG 2.1 AA)
  - Komunikaty błędów i powiadomienia

### 2.2. Poza zakresem testów (MVP)
- Współdzielenie zadań między użytkownikami
- Aplikacje mobilne (native)
- System oceny trudności zadań
- Zaawansowane mechanizmy cache'owania
- Szczegółowe analizy poza liczeniem akceptacji/odrzuceń
- Polityka prywatności i pełna zgodność z GDPR
- Testy wydajnościowe pod dużym obciążeniem
- Testy penetracyjne

## 3. Typy testów do przeprowadzenia

### 3.1. Testy jednostkowe (Unit Tests)
**Cel**: Weryfikacja pojedynczych funkcji, metod i komponentów w izolacji

**Zakres**:
- **Services** (`src/lib/services/`):
  - `AuthService` - metody login, register, changePassword, deleteAccount
  - `TopicsService` - CRUD operacje
  - `QuestionsService` - generowanie i zarządzanie pytaniami
  - `OpenRouterService` - komunikacja z API, obsługa błędów, parsowanie odpowiedzi
  
- **Validators** (`src/lib/validators/`):
  - Schematy Zod dla auth, topics, questions
  - Walidacja formatów danych, długości, wymaganych pól
  
- **Utilities** (`src/lib/utils.ts`):
  - Funkcje pomocnicze i helpery
  
- **Komponenty React** (wybrane):
  - Logika komponentów form (bez renderowania DOM)
  - Custom hooks (`useTopics`, `useGenerateQuestions`)

**Narzędzia**: Vitest, @testing-library/react

### 3.2. Testy integracyjne (Integration Tests)
**Cel**: Weryfikacja współpracy między komponentami systemu

**Zakres**:
- **API Endpoints** (`src/pages/api/`):
  - POST `/api/auth/login` - pełny przepływ logowania
  - POST `/api/auth/register` - rejestracja użytkownika
  - POST `/api/auth/logout` - wylogowanie
  - GET/POST/PUT/DELETE `/api/topics` - operacje na tematach
  - POST `/api/questions/generate` - generowanie pytań z AI
  
- **Middleware** (`src/middleware/index.ts`):
  - Inicjalizacja klienta Supabase
  - Weryfikacja sesji i tokenów
  - Przekierowania dla nieautoryzowanych użytkowników
  
- **Integracja z Supabase**:
  - Operacje na bazie danych
  - RLS policies enforcement
  - Autentykacja i refresh tokenów
  
- **Integracja z OpenRouter**:
  - Wysyłanie zapytań
  - Obsługa timeoutów
  - Parsowanie odpowiedzi JSON

**Narzędzia**: Vitest, Supertest (dla API), Testcontainers (opcjonalnie dla Supabase)

### 3.3. Testy end-to-end (E2E Tests)
**Cel**: Weryfikacja pełnych przepływów użytkownika w przeglądarce

**Zakres**:
- **Przepływy autentykacji**:
  - Rejestracja nowego użytkownika
  - Logowanie i wylogowanie
  - Zmiana hasła
  - Odzyskiwanie hasła (forgot password)
  - Usuwanie konta
  
- **Przepływy zarządzania tematami**:
  - Tworzenie nowego tematu
  - Edycja tematu
  - Usuwanie tematu
  - Przeglądanie listy tematów
  
- **Przepływy generowania pytań**:
  - Wybór tematu i grupy wiekowej
  - Generowanie zestawu pytań
  - Akceptowanie pytania
  - Odrzucanie pytania
  - Edycja pytania przed akceptacją
  
- **Przepływy przeglądania pytań**:
  - Filtrowanie po statusie
  - Filtrowanie po wieku i temacie
  - Paginacja
  - Edycja zaakceptowanych pytań
  - Usuwanie pytań

**Narzędzia**: Playwright

### 3.4. Testy bezpieczeństwa (Security Tests)
**Cel**: Weryfikacja zabezpieczeń aplikacji

**Zakres**:
- **Autentykacja i autoryzacja**:
  - Próby dostępu do chronionych endpointów bez tokenu
  - Próby dostępu z nieprawidłowym/wygasłym tokenem
  - Weryfikacja RLS - użytkownik A nie może zobaczyć danych użytkownika B
  
- **Walidacja danych wejściowych**:
  - SQL Injection (próby wstrzyknięcia SQL w polach tekstowych)
  - XSS (próby wstrzyknięcia skryptów JavaScript)
  - Przekroczenie limitów (np. > 10 pytań, za długie nazwy)
  - Nieprawidłowe typy danych
  
- **Bezpieczeństwo sesji**:
  - HTTP-only cookies
  - Secure flag w produkcji
  - SameSite: lax
  - Proper token expiration

**Narzędzia**: Vitest (dla testów jednostkowych security), Playwright (dla E2E security), OWASP ZAP (opcjonalnie)

### 3.5. Testy kompatybilności i responsywności
**Cel**: Zapewnienie działania aplikacji na różnych urządzeniach i przeglądarkach

**Zakres**:
- **Przeglądarki**:
  - Chrome (ostatnie 2 wersje)
  - Firefox (ostatnie 2 wersje)
  - Safari (ostatnie 2 wersje)
  - Edge (ostatnia wersja)
  
- **Urządzenia i rozdzielczości**:
  - Desktop (1920x1080, 1366x768)
  - Tablet (768x1024)
  - Mobile (375x667, 414x896)
  
- **Responsywność**:
  - Hamburger menu na mobile
  - Adaptacyjne layouty formularzy
  - Touch-friendly buttons i controls

**Narzędzia**: Playwright (cross-browser), BrowserStack (opcjonalnie)

### 3.6. Testy dostępności (Accessibility Tests)
**Cel**: Zapewnienie zgodności z WCAG 2.1 AA

**Zakres**:
- Semantyczny HTML
- ARIA labels i role
- Keyboard navigation
- Screen reader compatibility
- Kontrast kolorów
- Focus management
- Skip links

**Narzędzia**: axe-core, Playwright (z axe-playwright), pa11y

### 3.7. Testy wydajnościowe (Performance Tests) - ograniczony zakres MVP
**Cel**: Podstawowa weryfikacja wydajności

**Zakres**:
- Czas ładowania stron (< 3s)
- Czas odpowiedzi API (< 2s)
- Czas generowania pytań przez AI (< 30s)
- Bundle size optimization

**Narzędzia**: Lighthouse, WebPageTest

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł autentykacji

#### TC-AUTH-001: Rejestracja nowego użytkownika (happy path)
**Warunki wstępne**: Brak użytkownika z danym emailem w systemie  
**Kroki**:
1. Przejdź do `/register`
2. Wprowadź prawidłowy email (np. `test@example.com`)
3. Wprowadź prawidłowe hasło (min. 8 znaków, wielka litera, mała litera, cyfra)
4. Potwierdź hasło
5. Kliknij "Zarejestruj się"

**Oczekiwany rezultat**:
- Konto zostaje utworzone w Supabase Auth
- Użytkownik otrzymuje email potwierdzający
- Przekierowanie na stronę logowania z komunikatem sukcesu
- Status odpowiedzi: 201 Created

#### TC-AUTH-002: Rejestracja - walidacja hasła
**Warunki wstępne**: Strona `/register`  
**Kroki**:
1. Wprowadź email
2. Wprowadź słabe hasło (np. `test123` - brak wielkiej litery)
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat**:
- Wyświetlenie komunikatu błędu walidacji
- Formularz nie zostaje wysłany
- Użytkownik pozostaje na stronie rejestracji

#### TC-AUTH-003: Logowanie użytkownika (happy path)
**Warunki wstępne**: Użytkownik istnieje w systemie z potwierdzonym emailem  
**Kroki**:
1. Przejdź do `/login`
2. Wprowadź prawidłowy email
3. Wprowadź prawidłowe hasło
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- JWT tokens (access + refresh) zapisane w HTTP-only cookies
- Przekierowanie do `/topics`
- Status odpowiedzi: 200 OK
- `locals.user` zawiera dane użytkownika

#### TC-AUTH-004: Logowanie - nieprawidłowe credentials
**Warunki wstępne**: Strona `/login`  
**Kroki**:
1. Wprowadź email
2. Wprowadź nieprawidłowe hasło
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- Status odpowiedzi: 401 Unauthorized
- Wyświetlenie komunikatu "Nieprawidłowy email lub hasło"
- Użytkownik pozostaje na stronie logowania
- Brak ustawienia cookies

#### TC-AUTH-005: Wylogowanie użytkownika
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Kliknij na avatar użytkownika
2. Wybierz "Wyloguj się" z dropdown menu
3. Potwierdź wylogowanie

**Oczekiwany rezultat**:
- Sesja Supabase zostaje zakończona
- Cookies `sb-access-token` i `sb-refresh-token` są usuwane
- Przekierowanie do `/login`
- Status odpowiedzi: 200 OK

#### TC-AUTH-006: Zmiana hasła
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/settings`
2. Wprowadź obecne hasło
3. Wprowadź nowe hasło (spełniające wymagania)
4. Potwierdź nowe hasło
5. Kliknij "Zmień hasło"

**Oczekiwany rezultat**:
- Hasło zostaje zaktualizowane w Supabase Auth
- Wyświetlenie komunikatu sukcesu
- Użytkownik pozostaje zalogowany
- Status odpowiedzi: 200 OK

#### TC-AUTH-007: Odzyskiwanie hasła
**Warunki wstępne**: Użytkownik zapomniał hasła  
**Kroki**:
1. Przejdź do `/forgot-password`
2. Wprowadź email
3. Kliknij "Wyślij link resetujący"

**Oczekiwany rezultat**:
- Email z linkiem resetującym zostaje wysłany (Supabase Auth)
- Wyświetlenie komunikatu "Sprawdź swoją skrzynkę email"
- Status odpowiedzi: 200 OK

#### TC-AUTH-008: Usuwanie konta
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/settings`
2. Kliknij "Usuń konto"
3. Potwierdź w dialog box
4. Wprowadź hasło do potwierdzenia

**Oczekiwany rezultat**:
- Konto użytkownika zostaje usunięte z Supabase Auth
- Wszystkie powiązane dane (tematy, pytania) zostają usunięte (CASCADE)
- Wylogowanie i przekierowanie do `/`
- Status odpowiedzi: 200 OK

### 4.2. Moduł zarządzania tematami

#### TC-TOPICS-001: Tworzenie nowego tematu (happy path)
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/topics`
2. Kliknij "Dodaj temat"
3. Wprowadź nazwę tematu (np. "Matematyka")
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- POST `/api/topics` z body `{ "name": "Matematyka" }`
- Temat zostaje zapisany w bazie danych z `user_id` zalogowanego użytkownika
- Status odpowiedzi: 201 Created
- Lista tematów odświeża się i pokazuje nowy temat
- Dialog zamyka się automatycznie

#### TC-TOPICS-002: Walidacja nazwy tematu
**Warunki wstępne**: Dialog dodawania tematu jest otwarty  
**Kroki testowe**:
1. Pozostaw pole nazwy puste i kliknij "Zapisz"
2. Wprowadź nazwę > 100 znaków i kliknij "Zapisz"

**Oczekiwany rezultat**:
- Walidacja Zod blokuje request
- Wyświetlenie komunikatu błędu (frontend)
- Status odpowiedzi: 400 Bad Request (jeśli request dotrze do API)
- Temat nie zostaje zapisany

#### TC-TOPICS-003: Edycja tematu
**Warunki wstępne**: Użytkownik ma co najmniej jeden temat  
**Kroki**:
1. Przejdź do `/topics`
2. Kliknij ikonę "Edytuj" przy temacie
3. Zmień nazwę tematu
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- PUT `/api/topics/:id` z body `{ "name": "Nowa nazwa" }`
- Temat zostaje zaktualizowany w bazie danych
- `updated_at` timestamp zostaje automatycznie zaktualizowany (trigger)
- Status odpowiedzi: 200 OK
- Lista odświeża się z nową nazwą

#### TC-TOPICS-004: Usuwanie tematu
**Warunki wstępne**: Użytkownik ma co najmniej jeden temat  
**Kroki**:
1. Przejdź do `/topics`
2. Kliknij ikonę "Usuń" przy temacie
3. Potwierdź usunięcie w dialog box

**Oczekiwany rezultat**:
- DELETE `/api/topics/:id`
- Temat zostaje usunięty z bazy danych
- Wszystkie powiązane pytania zostają usunięte (CASCADE)
- Status odpowiedzi: 200 OK lub 204 No Content
- Lista odświeża się bez usuniętego tematu

#### TC-TOPICS-005: Pobieranie listy tematów
**Warunki wstępne**: Użytkownik jest zalogowany i ma kilka tematów  
**Kroki**:
1. Przejdź do `/topics`

**Oczekiwany rezultat**:
- GET `/api/topics`
- Zwrócona lista zawiera tylko tematy należące do zalogowanego użytkownika (RLS)
- Tematy posortowane według `created_at DESC`
- Status odpowiedzi: 200 OK

#### TC-TOPICS-006: RLS - próba dostępu do cudzego tematu
**Warunki wstępne**: Dwa użytkownicy w systemie (User A, User B)  
**Kroki**:
1. Zaloguj się jako User A
2. Pobierz ID tematu należącego do User B
3. Spróbuj wykonać PUT `/api/topics/{id_usera_B}` jako User A

**Oczekiwany rezultat**:
- RLS policy blokuje operację
- Status odpowiedzi: 404 Not Found lub 403 Forbidden
- Temat User B pozostaje niezmieniony
- Brak danych w odpowiedzi

### 4.3. Moduł generowania pytań

#### TC-QUESTIONS-001: Generowanie pytań (happy path)
**Warunki wstępne**: Użytkownik ma co najmniej jeden temat  
**Kroki**:
1. Przejdź do `/generate`
2. Wybierz temat z dropdown
3. Wybierz grupę wiekową (np. "5-6 lat")
4. Ustaw liczbę pytań (np. 5)
5. Kliknij "Generuj pytania"

**Oczekiwany rezultat**:
- POST `/api/questions/generate` z body:
  ```json
  {
    "topic_id": 1,
    "age_group": 5,
    "count": 5
  }
  ```
- Wyświetlenie loading spinner
- QuestionsService wywołuje OpenRouterService
- OpenRouterService wysyła request do OpenRouter API
- Wygenerowane pytania są parsowane i walidowane
- Batch insert do tabeli `questions` z statusem "pending"
- Status odpowiedzi: 201 Created
- Wyświetlenie 5 kart pytań ze statusem "pending"
- Każda karta ma przyciski: "Akceptuj", "Odrzuć", "Edytuj"

#### TC-QUESTIONS-002: Walidacja parametrów generowania
**Warunki wstępne**: Strona `/generate`  
**Scenariusze testowe**:
1. Brak wybranego tematu → błąd walidacji
2. Brak wybranej grupy wiekowej → błąd walidacji
3. Count = 0 → błąd walidacji
4. Count > 10 → błąd walidacji
5. Count = ujemna liczba → błąd walidacji

**Oczekiwany rezultat**:
- Walidacja Zod blokuje request
- Status odpowiedzi: 400 Bad Request
- Wyświetlenie komunikatu błędu
- Brak wywołania OpenRouter API

#### TC-QUESTIONS-003: Obsługa błędów OpenRouter API
**Warunki wstępne**: Symulacja błędu API (np. timeout, 500, rate limit)  
**Kroki**:
1. Przejdź do `/generate`
2. Wypełnij formularz
3. Kliknij "Generuj pytania"
4. OpenRouter API zwraca błąd

**Oczekiwany rezultat**:
- Wychwycenie błędu przez OpenRouterService
- Mapowanie błędu na odpowiedni kod (TIMEOUT_ERROR, SERVER_ERROR, RATE_LIMIT)
- Status odpowiedzi: 500 Internal Server Error
- Wyświetlenie toast notification z komunikatem błędu
- Przycisk "Spróbuj ponownie"
- Brak zapisania pytań do bazy danych

#### TC-QUESTIONS-004: Akceptowanie pytania
**Warunki wstępne**: Lista wygenerowanych pytań ze statusem "pending"  
**Kroki**:
1. Wyświetl listę wygenerowanych pytań
2. Kliknij "Akceptuj" na jednym z pytań

**Oczekiwany rezultat**:
- PATCH `/api/questions/:id` z body `{ "status": "accepted" }`
- Status pytania w bazie zmienia się na "accepted"
- Status odpowiedzi: 200 OK
- Karta pytania aktualizuje się (zmiana stylu, brak przycisku "Akceptuj")

#### TC-QUESTIONS-005: Odrzucanie pytania
**Warunki wstępne**: Lista wygenerowanych pytań ze statusem "pending"  
**Kroki**:
1. Wyświetl listę wygenerowanych pytań
2. Kliknij "Odrzuć" na jednym z pytań

**Oczekiwany rezultat**:
- PATCH `/api/questions/:id` z body `{ "status": "rejected" }`
- Status pytania w bazie zmienia się na "rejected"
- Status odpowiedzi: 200 OK
- Pytanie znika z listy lub zmienia wygląd (szare tło)

#### TC-QUESTIONS-006: Edycja pytania przed akceptacją
**Warunki wstępne**: Lista wygenerowanych pytań ze statusem "pending"  
**Kroki**:
1. Kliknij "Edytuj" na pytaniu
2. Zmień treść pytania
3. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- PATCH `/api/questions/:id` z body `{ "content": "Nowa treść" }`
- Treść pytania zostaje zaktualizowana w bazie danych
- Status odpowiedzi: 200 OK
- Karta pytania wyświetla nową treść
- Status pytania pozostaje "pending"

#### TC-QUESTIONS-007: Weryfikacja własności tematu
**Warunki wstępne**: User A ma topic_id=1, User B ma topic_id=2  
**Kroki**:
1. Zaloguj się jako User A
2. Wyślij POST `/api/questions/generate` z `topic_id: 2` (należy do User B)

**Oczekiwany rezultat**:
- `QuestionsService.verifyTopicOwnership()` zwraca błąd
- Status odpowiedzi: 404 Not Found
- Komunikat: "Topic not found or doesn't belong to user"
- Brak wygenerowania pytań

### 4.4. Moduł przeglądania pytań

#### TC-QUESTIONS-008: Filtrowanie pytań po statusie
**Warunki wstępne**: Użytkownik ma pytania w różnych statusach  
**Kroki**:
1. Przejdź do `/questions`
2. Kliknij zakładkę "Zaakceptowane"

**Oczekiwany rezultat**:
- GET `/api/questions?status=accepted`
- Wyświetlenie tylko pytań ze statusem "accepted"
- Status odpowiedzi: 200 OK

#### TC-QUESTIONS-009: Filtrowanie pytań po wieku i temacie
**Warunki wstępne**: Użytkownik ma pytania dla różnych grup wiekowych i tematów  
**Kroki**:
1. Przejdź do `/questions`
2. Wybierz filtr wieku: "5-6 lat"
3. Wybierz filtr tematu: "Matematyka"

**Oczekiwany rezultat**:
- GET `/api/questions?age_group=5&topic_id=1`
- Wyświetlenie tylko pytań spełniających oba kryteria
- Status odpowiedzi: 200 OK

#### TC-QUESTIONS-010: Paginacja listy pytań
**Warunki wstępne**: Użytkownik ma > 10 pytań  
**Kroki**:
1. Przejdź do `/questions`
2. Przewiń do końca listy
3. Kliknij "Następna strona"

**Oczekiwany rezultat**:
- GET `/api/questions?page=2&limit=10`
- Wyświetlenie pytań 11-20
- Status odpowiedzi: 200 OK
- Metadata paginacji: `{ page: 2, limit: 10, total: X }`

### 4.5. Middleware i autoryzacja

#### TC-MIDDLEWARE-001: Dostęp do chronionego endpointa bez tokenu
**Warunki wstępne**: Użytkownik niezalogowany  
**Kroki**:
1. Spróbuj otworzyć `/topics` bezpośrednio

**Oczekiwany rezultat**:
- Middleware wykrywa brak tokenu w cookies
- `locals.user = null`
- Przekierowanie do `/login?redirect=/topics`
- Brak dostępu do chronionej strony

#### TC-MIDDLEWARE-002: Dostęp z wygasłym tokenem
**Warunki wstępne**: Access token wygasł, refresh token jest ważny  
**Kroki**:
1. Wykonaj request do `/topics`

**Oczekiwany rezultat**:
- Middleware wywołuje `supabaseClient.auth.setSession()`
- Supabase automatycznie odświeża token
- Nowy access token jest zapisywany w cookies
- Request przechodzi dalej
- Użytkownik pozostaje zalogowany

#### TC-MIDDLEWARE-003: Access token i refresh token wygasły
**Warunki wstępne**: Oba tokeny są wygasłe  
**Kroki**:
1. Wykonaj request do `/topics`

**Oczekiwany rezultat**:
- `supabaseClient.auth.setSession()` zwraca błąd
- Cookies są usuwane
- `locals.user = null`
- Przekierowanie do `/login`

#### TC-MIDDLEWARE-004: Przekierowanie zalogowanego użytkownika
**Warunki wstępne**: Użytkownik jest już zalogowany  
**Kroki**:
1. Spróbuj otworzyć `/login`

**Oczekiwany rezultat**:
- Middleware wykrywa `locals.user != null`
- Przekierowanie do `/topics`
- Użytkownik nie widzi strony logowania

## 5. Środowisko testowe

### 5.1. Środowiska
1. **Development (local)**
   - URL: `http://localhost:3000`
   - Baza danych: Lokalna Supabase (Docker)
   - OpenRouter: Development API key z limitami
   
2. **Staging**
   - URL: `https://staging.edukids.app`
   - Baza danych: Supabase Staging Project
   - OpenRouter: Staging API key
   
3. **Production**
   - URL: `https://edukids.app`
   - Baza danych: Supabase Production Project
   - OpenRouter: Production API key z monitoring

### 5.2. Dane testowe
- **Użytkownicy testowi**:
  - `testuser1@edukids.test` (hasło: `Test1234`)
  - `testuser2@edukids.test` (hasło: `Test1234`)
  
- **Seed data**:
  - 5 przykładowych tematów na użytkownika
  - 20 przykładowych pytań w różnych statusach
  
- **Mock OpenRouter API**:
  - Stub responses dla testów jednostkowych i integracyjnych
  - Kontrolowane błędy (timeout, rate limit, server error)

### 5.3. Konfiguracja CI/CD
- **GitHub Actions**:
  - Automatyczne uruchomienie testów na każdy PR
  - Budowanie Docker image po merge do `main`
  - Deployment na staging po build
  - Deployment na production po manual approval

## 6. Narzędzia do testowania

### 6.1. Framework testowy
- **Vitest** - framework do testów jednostkowych i integracyjnych
  - Szybki, kompatybilny z Vite
  - Native ESM support
  - Snapshot testing
  - Coverage reporting

### 6.2. Testy jednostkowe i integracyjne
- **@testing-library/react** - testowanie komponentów React
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **msw (Mock Service Worker)** - mockowanie API calls
- **Supertest** - testowanie HTTP endpoints

### 6.3. Testy E2E
- **Playwright** - automatyzacja przeglądarek
  - Cross-browser testing (Chromium, Firefox, WebKit)
  - Parallel execution
  - Auto-waiting
  - Screenshots i video recording
  - Trace viewer

### 6.4. Testy bezpieczeństwa
- **OWASP ZAP** (opcjonalnie) - automated security scanning
- **eslint-plugin-security** - statyczna analiza kodu

### 6.5. Testy dostępności
- **axe-core** - automated accessibility testing
- **@axe-core/playwright** - integracja z Playwright
- **pa11y** - command-line accessibility testing

### 6.6. Code coverage
- **Vitest Coverage (c8)** - raportowanie pokrycia kodu
  - Minimum 70% coverage dla services i validators
  - Minimum 60% coverage dla komponentów

### 6.7. Continuous Integration
- **GitHub Actions** - automatyzacja testów
- **Docker** - konteneryzacja środowiska testowego
- **Testcontainers** (opcjonalnie) - kontenery dla Supabase/PostgreSQL

## 7. Harmonogram testów

### 7.1. Faza 1: Setup i testy jednostkowe (Tydzień 1-2)
**Zadania**:
- Konfiguracja Vitest i narzędzi testowych
- Napisanie testów jednostkowych dla validators (Zod schemas)
- Napisanie testów jednostkowych dla utilities
- Napisanie testów dla OpenRouterService
- Setup mock data i fixtures

**Milestone**: 80% pokrycia testami dla validators i services

### 7.2. Faza 2: Testy integracyjne API (Tydzień 3-4)
**Zadania**:
- Testy endpoints autentykacji (`/api/auth/*`)
- Testy endpoints tematów (`/api/topics/*`)
- Testy endpoints pytań (`/api/questions/*`)
- Testy middleware
- Setup Testcontainers dla Supabase (opcjonalnie)

**Milestone**: Wszystkie API endpoints pokryte testami integracyjnymi

### 7.3. Faza 3: Testy komponentów React (Tydzień 5)
**Zadania**:
- Testy formularzy (LoginForm, RegisterForm, TopicForm)
- Testy custom hooks (useTopics, useGenerateQuestions)
- Testy komponentów UI (EmptyState, ErrorAlert, LoadingSpinner)
- Snapshot testing dla stabilnych komponentów

**Milestone**: 70% pokrycia dla komponentów React

### 7.4. Faza 4: Testy E2E (Tydzień 6-7)
**Zadania**:
- Setup Playwright
- Napisanie testów dla przepływów autentykacji
- Napisanie testów dla przepływów zarządzania tematami
- Napisanie testów dla przepływów generowania pytań
- Konfiguracja parallel execution i retry logic

**Milestone**: Kluczowe user journeys pokryte testami E2E

### 7.5. Faza 5: Testy bezpieczeństwa i dostępności (Tydzień 8)
**Zadania**:
- Testy RLS policies
- Testy walidacji i zabezpieczeń przed injection
- Testy dostępności z axe-core
- Testy cross-browser compatibility
- Security audit z OWASP ZAP (opcjonalnie)

**Milestone**: Aplikacja spełnia standardy bezpieczeństwa i dostępności

### 7.6. Faza 6: CI/CD i automatyzacja (Tydzień 9)
**Zadania**:
- Konfiguracja GitHub Actions workflows
- Setup coverage reporting
- Integracja z PR checks
- Konfiguracja auto-deployment po przejściu testów
- Dokumentacja procesu testowania

**Milestone**: Pełna automatyzacja testów w pipeline CI/CD

### 7.7. Faza 7: Testy regresji i smoke tests (Tydzień 10)
**Zadania**:
- Zestaw smoke tests dla kluczowych funkcjonalności
- Regression test suite
- Performance baseline tests
- Load testing (podstawowe)

**Milestone**: Stabilny test suite gotowy do długoterminowego utrzymania

## 8. Kryteria akceptacji testów

### 8.1. Pokrycie kodu (Code Coverage)
- **Services** (`src/lib/services/`): minimum 80%
- **Validators** (`src/lib/validators/`): minimum 90%
- **API Routes** (`src/pages/api/`): minimum 75%
- **Components** (wybrane krytyczne): minimum 60%
- **Utilities**: minimum 80%

### 8.2. Wskaźniki jakości
- **Wszystkie testy jednostkowe**: 100% pass rate
- **Wszystkie testy integracyjne**: 100% pass rate
- **Testy E2E**: minimum 95% pass rate (dopuszczalne flaky tests z retry)
- **Testy bezpieczeństwa**: 0 krytycznych vulnerabilities
- **Testy dostępności**: 0 krytycznych naruszeń WCAG 2.1 AA

### 8.3. Wydajność testów
- **Testy jednostkowe**: < 30 sekund total execution time
- **Testy integracyjne**: < 2 minuty total execution time
- **Testy E2E**: < 10 minut total execution time (z parallel execution)

### 8.4. Stabilność
- **Flaky test rate**: < 5%
- **Test maintenance**: < 10% testów wymaga aktualizacji przy zmianach kodu

### 8.5. Dokumentacja
- Każdy test case ma jasny opis celu
- Wszystkie assertion messages są zrozumiałe
- README z instrukcjami uruchomienia testów
- Dokumentacja setup środowiska testowego

### 8.6. Kryteria blokujące deployment
**Deployment na staging jest blokowany jeśli**:
- Coverage < 70% dla services/validators
- Jakikolwiek test jednostkowy/integracyjny failuje
- Wykryto krytyczne vulnerability

**Deployment na production jest blokowany jeśli**:
- Coverage < 75% dla services/validators
- Jakikolwiek test failuje
- Testy E2E smoke tests failują
- Wykryto jakąkolwiek vulnerability (critical lub high)
- Testy dostępności wykryły krytyczne naruszenia WCAG

## 9. Role i odpowiedzialności w procesie testowania

### 9.1. QA Engineer (dedykowany lub shared)
**Odpowiedzialności**:
- Projektowanie strategii testowej i planu testów
- Tworzenie i utrzymanie test cases
- Wykonywanie testów manualnych (exploratory testing)
- Review testów automatycznych
- Zarządzanie test data i środowiskiem testowym
- Raportowanie metryk jakości

**Czas zaangażowania**: 50-100% (w zależności od fazy)

### 9.2. Backend Developer
**Odpowiedzialności**:
- Pisanie testów jednostkowych dla services i API endpoints
- Pisanie testów integracyjnych dla API
- Implementacja fixtures i mock data
- Zapewnienie testability kodu (dependency injection)
- Code review testów innych developerów

**Czas zaangażowania**: 20-30% czasu development

### 9.3. Frontend Developer
**Odpowiedzialności**:
- Pisanie testów jednostkowych dla komponentów React
- Pisanie testów dla custom hooks
- Implementacja testów E2E (Playwright)
- Zapewnienie accessibility w komponentach
- Code review testów frontend

**Czas zaangażowania**: 20-30% czasu development

### 9.4. DevOps Engineer
**Odpowiedzialności**:
- Konfiguracja CI/CD pipeline dla testów
- Setup i utrzymanie środowisk testowych
- Konfiguracja Testcontainers i Docker dla testów
- Monitoring wykonania testów w pipeline
- Optymalizacja czasu wykonania testów

**Czas zaangażowania**: 10-20% (setup), 5% (maintenance)

### 9.5. Tech Lead / Architect
**Odpowiedzialności**:
- Review i approval strategii testowej
- Definiowanie standardów jakości i coverage requirements
- Priorytetyzacja test cases
- Decyzje o trade-offs (coverage vs speed)
- Mentoring zespołu w best practices testowania

**Czas zaangażowania**: 5-10%

### 9.6. Product Owner
**Odpowiedzialności**:
- Definiowanie acceptance criteria dla features
- Priorytetyzacja testowania funkcjonalności biznesowych
- Approval kryteriów akceptacji testów
- Decyzje o go/no-go dla deploymentów

**Czas zaangażowania**: 5%

## 10. Procedury raportowania błędów

### 10.1. Narzędzie do tracking błędów
**Rekomendacja**: GitHub Issues (integracja z repo) lub Jira

### 10.2. Klasyfikacja błędów

#### Priorytet
- **P0 - Critical**: Blokuje kluczowe funkcjonalności, security vulnerability, data loss
  - **SLA**: Fix w ciągu 24h
  - **Deployment**: Blokuje deployment
  
- **P1 - High**: Poważny wpływ na UX, workaround dostępny
  - **SLA**: Fix w ciągu 3-5 dni
  - **Deployment**: Może blokować deployment
  
- **P2 - Medium**: Mniejszy wpływ na UX, łatwy workaround
  - **SLA**: Fix w następnym sprincie
  - **Deployment**: Nie blokuje
  
- **P3 - Low**: Kosmetyczne, nice-to-have
  - **SLA**: Backlog
  - **Deployment**: Nie blokuje

#### Severity (dotkliwość)
- **Critical**: Crash aplikacji, brak dostępu do systemu
- **Major**: Funkcjonalność nie działa zgodnie z wymaganiami
- **Minor**: Drobne odchylenia od specyfikacji
- **Trivial**: Literówki, drobne problemy UI

### 10.3. Template zgłoszenia błędu

```markdown
## Tytuł błędu
[Krótki, opisowy tytuł]

## Priorytet / Severity
P1 / Major

## Środowisko
- URL: https://staging.edukids.app
- Przeglądarka: Chrome 120
- OS: macOS 14
- User: testuser1@edukids.test

## Kroki do reprodukcji
1. Zaloguj się jako testuser1
2. Przejdź do /generate
3. Wybierz temat "Matematyka"
4. Kliknij "Generuj pytania"

## Aktualny rezultat
Spinner ładuje się w nieskończoność, pytania nie są generowane

## Oczekiwany rezultat
Pytania powinny być wygenerowane w ciągu 30 sekund

## Logi / Screenshots
- Screenshot: [załącznik]
- Console errors: [załącznik]
- Network tab: [załącznik]

## Dodatkowe informacje
- Występuje tylko dla tematów utworzonych dzisiaj
- Nie występuje w środowisku local

## Powiązane test case
TC-QUESTIONS-001
```

### 10.4. Workflow obsługi błędów

1. **Wykrycie błędu** → Sprawdzenie czy nie jest duplikatem
2. **Przypisanie priorytetu i severity** → Klasyfikacja według wpływu
3. **P0 bugs** → Natychmiastowe powiadomienie Tech Lead
4. **Analiza root cause** → Identyfikacja źródła problemu
5. **Implementacja fix** → Naprawa błędu
6. **Code review** → Przegląd kodu przez innego developera
7. **Deploy fix na staging** → Wdrożenie poprawki
8. **Verification testing** → Weryfikacja czy błąd został naprawiony
9. **Deploy na production** → Wdrożenie na środowisko produkcyjne
10. **Zamknięcie issue** → Dokumentacja rozwiązania

### 10.5. Komunikacja
- **P0 bugs**: Slack channel #critical-bugs + email do Tech Lead
- **P1 bugs**: Slack channel #bugs
- **P2/P3 bugs**: GitHub Issues, review na daily standup

### 10.6. Metryki i raportowanie
**Tygodniowy raport QA**:
- Liczba nowych błędów (per priority)
- Liczba zamkniętych błędów
- Średni czas do fix (per priority)
- Open bugs age
- Test coverage trends
- Flaky tests report

**Miesięczny raport jakości**:
- Escape rate (bugs found in production vs staging)
- Test execution trends
- Test automation ROI
- Reliability metrics (uptime, error rates)

---

## Podsumowanie

Plan testów dla projektu EduKids został zaprojektowany z uwzględnieniem specyfiki aplikacji edukacyjnej opartej o AI, stack technologiczny (Astro, React, Supabase, OpenRouter) oraz wymogów bezpieczeństwa danych użytkowników. 

**Kluczowe aspekty planu**:
1. **Wielowarstwowe testowanie**: od jednostkowych po E2E
2. **Priorytet bezpieczeństwa**: RLS, walidacja, ochrona przed injection
3. **Obsługa integracji zewnętrznych**: testy dla Supabase i OpenRouter API
4. **Automatyzacja**: CI/CD pipeline z blokowaniem deployment przy failed tests
5. **Dostępność**: zgodność z WCAG 2.1 AA
6. **Jasne kryteria akceptacji**: konkretne metryki coverage i quality gates

**Oczekiwane rezultaty**:
- Wykrycie 95% błędów przed production
- Redukcja czasu regression testing o 80% dzięki automatyzacji
- Pewność deployment dzięki comprehensive test suite
- Długoterminowa utrzymywalność kodu dzięki wysokiej jakości testów

