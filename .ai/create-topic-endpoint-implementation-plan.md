# API Endpoint Implementation Plan: POST /api/topics

## 1. Przegląd punktu końcowego

Endpoint **POST /api/topics** służy do tworzenia nowego tematu (topic) dla zalogowanego użytkownika. Każdy użytkownik może tworzyć własne tematy, które będą później wykorzystywane do generowania pytań edukacyjnych dla dzieci w określonych grupach wiekowych. Endpoint zapewnia walidację danych wejściowych, uwierzytelnianie użytkownika oraz bezpieczne zapisywanie danych w bazie PostgreSQL za pośrednictwem Supabase.

**Kluczowe funkcjonalności:**
- Tworzenie nowego tematu z unikalną nazwą (1-100 znaków)
- Automatyczne przypisanie `user_id` z kontekstu autentykacji
- Automatyczne generowanie `id`, `created_at` i `updated_at` przez bazę danych
- Zabezpieczenie przez RLS policies Supabase (użytkownik może tworzyć tylko własne tematy)

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
```
POST /api/topics
```

### Nagłówki
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (zarządzane przez Supabase Auth)

### Parametry

**Wymagane:**
- Brak parametrów URL
- Request Body:
  - `name` (string): Nazwa tematu, długość 1-100 znaków

**Opcjonalne:**
- Brak opcjonalnych parametrów

### Request Body

```typescript
{
  "name": "Matematyka dla 6-latków"
}
```

**Struktura:**
- `name`: string (wymagane, 1-100 znaków)

### Przykłady żądań

**Poprawne żądanie:**
```json
{
  "name": "Historia Polski"
}
```

**Niepoprawne żądania:**
```json
// Zbyt krótka nazwa (pusta)
{
  "name": ""
}

// Zbyt długa nazwa (> 100 znaków)
{
  "name": "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud"
}

// Brak wymaganego pola
{
  "title": "Geografia"
}
```

## 3. Wykorzystywane typy

### Command Model
```typescript
// src/types.ts - linia 52
export type CreateTopicCommand = Pick<TablesInsert<"topics">, "name">;
```

Używany do walidacji żądania w schemacie Zod.

### Response DTO
```typescript
// src/types.ts - linia 19
export type TopicDto = Tables<"topics">;
```

Struktura odpowiedzi:
```typescript
{
  id: number;
  user_id: string;
  name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string | null; // ISO 8601 timestamp
}
```

### Validation Rules
```typescript
// src/types.ts - linia 228-232
export const ValidationRules = {
  topic: {
    nameMinLength: 1,
    nameMaxLength: 100,
  },
  // ...
} as const;
```

### Zod Schema (do utworzenia)
```typescript
import { z } from "zod";
import { ValidationRules } from "../types";

export const createTopicSchema = z.object({
  name: z.string()
    .min(ValidationRules.topic.nameMinLength, "Nazwa tematu musi mieć co najmniej 1 znak")
    .max(ValidationRules.topic.nameMaxLength, "Nazwa tematu może mieć maksymalnie 100 znaków")
    .trim(),
});
```

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu (201 Created)

**Status Code:** `201 Created`

**Body:**
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Matematyka dla 6-latków",
  "created_at": "2025-11-06T10:30:00.000Z",
  "updated_at": null
}
```

### Odpowiedzi błędów

#### 400 Bad Request
Nieprawidłowe dane wejściowe.

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "name",
      "message": "Nazwa tematu może mieć maksymalnie 100 znaków"
    }
  ]
}
```

#### 401 Unauthorized
Brak tokena JWT lub token jest nieprawidłowy/wygasły.

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 500 Internal Server Error
Błąd serwera lub bazy danych.

```json
{
  "error": "Internal server error",
  "message": "Failed to create topic"
}
```

## 5. Przepływ danych

### Diagram przepływu
```
1. Klient → POST /api/topics + JWT
   ↓
2. Astro Middleware → Weryfikacja JWT (Supabase Auth)
   ↓
3. API Route → Walidacja body (Zod schema)
   ↓
4. Topics Service → Ekstrakcja user_id z auth context
   ↓
5. Supabase Client → INSERT do tabeli topics
   ↓
6. PostgreSQL → RLS Policy check (user_id = auth.uid())
   ↓
7. PostgreSQL → Zwrócenie utworzonego rekordu
   ↓
8. API Route → Response 201 z TopicDto
   ↓
9. Klient ← JSON response
```

### Szczegółowy opis przepływu

**Krok 1: Przyjęcie żądania**
- Astro odbiera żądanie POST na `/api/topics`
- Middleware `src/middleware/index.ts` inicjalizuje klienta Supabase
- JWT token jest wyodrębniany z nagłówków i przekazywany do Supabase

**Krok 2: Uwierzytelnianie**
- Supabase weryfikuje JWT token
- Jeśli token jest prawidłowy, informacje o użytkowniku są dostępne przez `context.locals.supabase.auth.getUser()`
- Jeśli token jest nieprawidłowy → 401 Unauthorized

**Krok 3: Walidacja danych wejściowych**
- Request body jest parsowany jako JSON
- Zod schema waliduje strukturę i zawartość
- Jeśli walidacja nie powiedzie się → 400 Bad Request z szczegółami błędów

**Krok 4: Wywołanie serwisu**
- API route wywołuje `topicsService.createTopic()`
- Przekazuje zwalidowane dane i user_id z kontekstu autentykacji

**Krok 5: Zapis do bazy danych**
- Serwis używa Supabase client do wykonania INSERT
- `user_id` jest automatycznie dodawany do zapytania
- Supabase SDK używa przygotowanych instrukcji (protection against SQL injection)

**Krok 6: RLS Policy enforcement**
- PostgreSQL wykonuje RLS policy check
- Policy sprawdza, czy `user_id` w rekordzie = `auth.uid()` z JWT
- Jeśli nie spełnione → błąd autoryzacji

**Krok 7: Zwrócenie odpowiedzi**
- Baza danych zwraca pełny utworzony rekord (z `id`, `created_at`, etc.)
- Serwis zwraca `TopicDto` do API route
- API route zwraca odpowiedź 201 Created z JSON body

### Interakcje z zewnętrznymi usługami

**Supabase:**
- Weryfikacja JWT (Auth service)
- Operacje na bazie danych (PostgreSQL)
- Enforcement RLS policies

**PostgreSQL:**
- Walidacja CHECK constraints (length check na `name`)
- Generowanie SERIAL `id`
- Ustawianie DEFAULT `created_at` (now())

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

**Mechanizm:** JWT Bearer Token
- Token generowany przez Supabase Auth podczas logowania
- Token przekazywany w nagłówku `Authorization: Bearer <token>`
- Weryfikacja tokena przez Supabase SDK w middleware
- Token zawiera `user_id` (`sub` claim) używany do autoryzacji

**Implementacja:**
```typescript
// W middleware (już zaimplementowane)
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
```

### Autoryzacja (Authorization)

**Row-Level Security (RLS):**
- RLS policies w PostgreSQL wymuszają, że użytkownik może tworzyć tylko własne tematy
- Policy: `user_id = auth.uid()` w INSERT
- Automatycznie sprawdzane przez Supabase przy każdej operacji

**Implementacja w bazie danych:**
```sql
-- Policy już zdefiniowana w migracji
CREATE POLICY "Users can insert their own topics"
ON topics FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

### Walidacja danych wejściowych

**Zod Schema Validation:**
- Sprawdzenie typu danych (string)
- Sprawdzenie długości (1-100 znaków)
- Trimming białych znaków
- Ochrona przed injection attacks

**Warstwy walidacji:**
1. **API Layer (Zod):** Sprawdzenie formatu i typu danych
2. **Database Layer (CHECK constraints):** Dodatkowa ochrona na poziomie bazy
3. **Supabase SDK:** Prepared statements przeciwko SQL injection

### Ochrona przed atakami

**SQL Injection:**
- Supabase SDK używa prepared statements
- Brak bezpośredniego konkatenowania stringów w SQL
- Parametryzowane zapytania

**XSS (Cross-Site Scripting):**
- API endpoint nie renderuje HTML
- Odpowiedzialność za escaping po stronie klienta (React)
- Content-Type: application/json

**CSRF (Cross-Site Request Forgery):**
- JWT token w nagłówku (nie w cookie)
- Same-Site polityka (konfiguracja Astro)

**Rate Limiting:**
- Nie w MVP, ale zalecane do przyszłej implementacji
- Możliwość użycia middleware lub proxy (nginx)

### Bezpieczeństwo sesji

**JWT Token Management:**
- Token stored securely na kliencie (httpOnly cookie lub secure storage)
- Token expiration handling
- Refresh token mechanism (zarządzany przez Supabase)

## 7. Obsługa błędów

### Tabela błędów

| Status Code | Scenariusz | Przyczyna | Odpowiedź |
|-------------|------------|-----------|-----------|
| 201 | Sukces | Topic utworzony pomyślnie | `{ id, user_id, name, created_at, updated_at }` |
| 400 | Bad Request | Brak pola `name` | `{ error: "Validation error", details: [{ field: "name", message: "Required" }] }` |
| 400 | Bad Request | `name` jest pusty string | `{ error: "Validation error", details: [{ field: "name", message: "Nazwa tematu musi mieć co najmniej 1 znak" }] }` |
| 400 | Bad Request | `name` > 100 znaków | `{ error: "Validation error", details: [{ field: "name", message: "Nazwa tematu może mieć maksymalnie 100 znaków" }] }` |
| 400 | Bad Request | `name` nie jest stringiem | `{ error: "Validation error", details: [{ field: "name", message: "Expected string, received ..." }] }` |
| 400 | Bad Request | Body nie jest JSON | `{ error: "Invalid JSON", message: "Request body must be valid JSON" }` |
| 401 | Unauthorized | Brak tokena JWT | `{ error: "Unauthorized", message: "Authentication required" }` |
| 401 | Unauthorized | Token nieprawidłowy | `{ error: "Unauthorized", message: "Invalid token" }` |
| 401 | Unauthorized | Token wygasły | `{ error: "Unauthorized", message: "Token expired" }` |
| 500 | Internal Error | Błąd połączenia z bazą | `{ error: "Internal server error", message: "Failed to create topic" }` |
| 500 | Internal Error | Nieoczekiwany błąd serwera | `{ error: "Internal server error", message: "An unexpected error occurred" }` |

### Strategia logowania

**Server-side logging:**
```typescript
// Błędy walidacji (poziom INFO)
console.info("Validation failed for POST /api/topics", { errors: validationErrors });

// Błędy autoryzacji (poziom WARN)
console.warn("Unauthorized access attempt to POST /api/topics", { userId: "unknown" });

// Błędy bazy danych (poziom ERROR)
console.error("Database error in POST /api/topics", { error: error.message, userId });

// Nieoczekiwane błędy (poziom ERROR)
console.error("Unexpected error in POST /api/topics", { error, userId });
```

### Struktura odpowiedzi błędów

**Spójna struktura:**
```typescript
interface ErrorResponse {
  error: string; // Krótki opis typu błędu
  message?: string; // Szczegółowy komunikat dla użytkownika
  details?: Array<{ // Opcjonalne szczegóły (dla błędów walidacji)
    field: string;
    message: string;
  }>;
}
```

### Error Handling w kodzie

**Try-catch blocks:**
```typescript
try {
  // Walidacja
  const validatedData = createTopicSchema.parse(body);
  
  // Logika biznesowa
  const topic = await topicsService.createTopic(user.id, validatedData);
  
  // Sukces
  return new Response(JSON.stringify(topic), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
  
} catch (error) {
  if (error instanceof z.ZodError) {
    // Błąd walidacji (400)
    return new Response(JSON.stringify({
      error: "Validation error",
      details: error.errors.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Inne błędy (500)
  console.error("Error creating topic:", error);
  return new Response(JSON.stringify({
    error: "Internal server error",
    message: "Failed to create topic"
  }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

**1. Połączenie z bazą danych:**
- Single INSERT operation - minimalny overhead
- Connection pooling zarządzany przez Supabase
- Potencjalne opóźnienie przy dużej liczbie równoczesnych żądań

**2. Weryfikacja JWT:**
- Każde żądanie wymaga weryfikacji tokena
- Supabase cache mechanizm może przyspieszyć weryfikację
- Minimalny wpływ na performance (< 10ms)

**3. RLS Policy checking:**
- PostgreSQL musi sprawdzić policy przy INSERT
- Dodatkowe overhead (~5-10ms)
- Niezbędne dla bezpieczeństwa

### Strategie optymalizacji

**1. Connection Pooling:**
- Używaj Supabase connection pooler dla API routes
- Konfiguracja już dostępna w Supabase (pgBouncer)

**2. Caching:**
- Topic list może być cache'owany po stronie klienta
- POST /api/topics nie wymaga cache'owania (zawsze tworzy nowy)
- Rozważ cache invalidation dla GET /api/topics po utworzeniu

**3. Walidacja po stronie klienta:**
- Implement front-end validation (React Hook Form + Zod)
- Redukuje niepotrzebne API calls
- Server-side validation wciąż wymagana (security)

**4. Monitoring:**
- Track response times
- Monitor database query performance
- Alert na wolne zapytania (> 500ms)

### Metryki wydajności (oczekiwane)

- **Response time:** < 200ms (p95)
- **Database query time:** < 50ms (p95)
- **JWT verification:** < 10ms (p95)
- **Total request time:** < 300ms (p95)

### Skalowanie

**Horizontal scaling:**
- Astro API routes są stateless
- Łatwe skalowanie przez dodanie więcej instancji
- Load balancer przed Astro servers

**Database scaling:**
- Supabase zarządza skalowaniem PostgreSQL
- Read replicas dla operacji GET (nie dotyczy POST)

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików
**Cel:** Utworzyć niezbędne pliki i foldery

**Akcje:**
- Utworzyć katalog `src/pages/api/topics/` jeśli nie istnieje
- Utworzyć katalog `src/lib/services/` jeśli nie istnieje
- Utworzyć katalog `src/lib/validators/` dla schematów Zod

**Pliki do utworzenia:**
- `src/pages/api/topics/index.ts` - API route handler
- `src/lib/services/topics.service.ts` - Logika biznesowa
- `src/lib/validators/topics.validators.ts` - Zod schemas

### Krok 2: Utworzenie Zod validation schema
**Cel:** Zdefiniować schemat walidacji dla CreateTopicCommand

**Plik:** `src/lib/validators/topics.validators.ts`

**Implementacja:**
```typescript
import { z } from "zod";
import { ValidationRules } from "../../types";

export const createTopicSchema = z.object({
  name: z.string()
    .min(ValidationRules.topic.nameMinLength, {
      message: "Nazwa tematu musi mieć co najmniej 1 znak"
    })
    .max(ValidationRules.topic.nameMaxLength, {
      message: "Nazwa tematu może mieć maksymalnie 100 znaków"
    })
    .trim(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
```

**Weryfikacja:**
- Schema eksportuje typ `CreateTopicInput` zgodny z `CreateTopicCommand`
- Walidacja zgodna z `ValidationRules` z `types.ts`
- Komunikaty błędów po polsku

### Krok 3: Implementacja Topics Service
**Cel:** Ekstrakcja logiki biznesowej do osobnego serwisu

**Plik:** `src/lib/services/topics.service.ts`

**Implementacja:**
```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { TopicDto } from "../../types";
import type { CreateTopicInput } from "../validators/topics.validators";

export class TopicsService {
  constructor(private supabase: SupabaseClient) {}

  async createTopic(userId: string, data: CreateTopicInput): Promise<TopicDto> {
    const { data: topic, error } = await this.supabase
      .from("topics")
      .insert({
        name: data.name,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating topic:", error);
      throw new Error("Failed to create topic");
    }

    if (!topic) {
      throw new Error("Topic was not returned after creation");
    }

    return topic;
  }
}
```

**Szczegóły:**
- Używa `SupabaseClient` type z `src/db/supabase.client.ts`
- Metoda `createTopic` przyjmuje `userId` i zwalidowane dane
- `.insert()` tworzy nowy rekord
- `.select()` zwraca utworzony rekord
- `.single()` zapewnia, że zwracany jest pojedynczy obiekt (nie array)
- Rzuca błąd jeśli operacja się nie powiedzie

**Weryfikacja:**
- Service używa dependency injection (Supabase client w konstruktorze)
- Metoda jest async i zwraca Promise<TopicDto>
- Error handling zgodny z best practices

### Krok 4: Implementacja API Route Handler
**Cel:** Utworzyć endpoint POST /api/topics

**Plik:** `src/pages/api/topics/index.ts`

**Implementacja:**
```typescript
import type { APIRoute } from "astro";
import { TopicsService } from "../../../lib/services/topics.service";
import { createTopicSchema } from "../../../lib/validators/topics.validators";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autentykacji
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 2. Parsowanie i walidacja request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const validatedData = createTopicSchema.parse(body);

    // 3. Utworzenie serwisu i wywołanie metody
    const topicsService = new TopicsService(locals.supabase);
    const topic = await topicsService.createTopic(user.id, validatedData);

    // 4. Zwrócenie odpowiedzi sukcesu
    return new Response(JSON.stringify(topic), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Obsługa innych błędów
    console.error("Error in POST /api/topics:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to create topic"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
```

**Szczegóły implementacji:**
- `export const prerender = false` - wyłącza pre-rendering (API route)
- Używa `locals.supabase` zamiast importować `supabaseClient` (zgodnie z regułami)
- Sprawdza autentykację na początku (early return pattern)
- Waliduje JSON przed parsowaniem przez Zod
- Tworzy instancję serwisu z Supabase client z locals
- Zwraca 201 Created przy sukcesie
- Obsługuje błędy walidacji i błędy serwera osobno

**Weryfikacja:**
- Route używa typu `APIRoute` z Astro
- Wszystkie responses mają `Content-Type: application/json`
- Error handling zgodny z tabelą błędów z sekcji 7
- Kod zgodny z zasadami clean code (early returns, guard clauses)

### Krok 5: Testowanie endpointu
**Cel:** Zweryfikować poprawność implementacji

**Metody testowania:**

**5.1. Manual testing z curl:**
```bash
# Test bez autoryzacji (oczekiwany: 401)
curl -X POST http://localhost:4321/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Topic"}'

# Test z autoryzacją (oczekiwany: 201)
# Najpierw uzyskaj JWT token z Supabase Auth
curl -X POST http://localhost:4321/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Matematyka"}'

# Test z nieprawidłowymi danymi (oczekiwany: 400)
curl -X POST http://localhost:4321/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": ""}'

# Test z długą nazwą (oczekiwany: 400)
curl -X POST http://localhost:4321/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad"}'
```

**5.2. Testing z Postman/Insomnia:**
- Utworzyć kolekcję dla API
- Dodać request POST /api/topics
- Testować różne scenariusze z tabeli błędów

**5.3. Weryfikacja w bazie danych:**
```sql
-- Sprawdzenie, czy topic został utworzony
SELECT * FROM topics WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 1;

-- Weryfikacja RLS policies
-- Próba INSERT jako inny użytkownik powinna być zablokowana
```

**Scenariusze do przetestowania:**
- ✅ Utworzenie topic z prawidłowymi danymi (201)
- ✅ Brak tokena JWT (401)
- ✅ Nieprawidłowy token JWT (401)
- ✅ Brak pola `name` (400)
- ✅ Pusta nazwa (400)
- ✅ Nazwa > 100 znaków (400)
- ✅ Nazwa nie jest stringiem (400)
- ✅ Nieprawidłowy JSON (400)

### Krok 6: Obsługa linter errors
**Cel:** Upewnić się, że kod nie ma błędów linter'a

**Akcje:**
```bash
# Uruchomienie linter'a
npm run lint

# Automatyczne poprawianie błędów (jeśli możliwe)
npm run lint:fix
```

**Sprawdzenie:**
- Brak błędów TypeScript
- Brak błędów ESLint
- Wszystkie importy poprawne
- Typy są zgodne z `database.types.ts` i `types.ts`

**Typowe problemy i rozwiązania:**
- **Unused variables:** Usuń nieużywane zmienne
- **Missing types:** Dodaj explicite typy gdzie wymagane
- **Import errors:** Sprawdź ścieżki importów (relatywne vs absolute)

### Krok 7: Dokumentacja i komentarze
**Cel:** Dodać dokumentację JSDoc do kodu

**Akcje:**
```typescript
/**
 * Topics Service
 * Handles business logic for topic management
 */
export class TopicsService {
  /**
   * Creates a new topic for the authenticated user
   * @param userId - The ID of the authenticated user
   * @param data - Validated topic data
   * @returns Promise resolving to the created topic
   * @throws Error if creation fails
   */
  async createTopic(userId: string, data: CreateTopicInput): Promise<TopicDto> {
    // ...
  }
}
```

**Dokumentacja API route:**
```typescript
/**
 * POST /api/topics
 * Creates a new topic for the authenticated user
 * 
 * @requires Authentication (JWT Bearer token)
 * @body { name: string } - Topic name (1-100 chars)
 * @returns 201 - Created topic object
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized
 * @returns 500 - Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // ...
};
```

### Krok 8: Code review checklist
**Cel:** Finalna weryfikacja przed deployment

**Checklist:**
- [ ] Kod jest zgodny z zasadami clean code (early returns, guard clauses)
- [ ] Wszystkie błędy są odpowiednio obsługiwane
- [ ] Walidacja jest kompletna i zgodna z specyfikacją
- [ ] Typy są zgodne z `types.ts` i `database.types.ts`
- [ ] Używane są prawidłowe kody statusu HTTP
- [ ] Logowanie błędów jest implementowane
- [ ] Dokumentacja JSDoc jest dodana
- [ ] Linter nie zgłasza błędów
- [ ] Endpoint został przetestowany manualnie
- [ ] RLS policies działają poprawnie
- [ ] `user_id` jest poprawnie wyodrębniony z JWT
- [ ] Response zawiera wszystkie wymagane pola
- [ ] Kod używa `locals.supabase` zamiast `supabaseClient`
- [ ] `export const prerender = false` jest ustawione

### Krok 9: Integration testing (opcjonalne, po MVP)
**Cel:** Automated testing dla endpointu

**Framework:** Vitest + Supertest

**Przykładowy test:**
```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("POST /api/topics", () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Authenticate and get JWT token
    const supabase = createClient(/* ... */);
    const { data } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "password"
    });
    authToken = data.session.access_token;
  });

  it("should create a topic with valid data", async () => {
    const response = await fetch("http://localhost:4321/api/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ name: "Test Topic" })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data.name).toBe("Test Topic");
  });

  it("should return 401 without authentication", async () => {
    const response = await fetch("http://localhost:4321/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Topic" })
    });
    
    expect(response.status).toBe(401);
  });

  it("should return 400 with invalid name", async () => {
    const response = await fetch("http://localhost:4321/api/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ name: "" })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Validation error");
  });
});
```

## 10. Podsumowanie

### Kluczowe punkty implementacji

1. **Architektura:**
   - API Route handler w `src/pages/api/topics/index.ts`
   - Business logic w `src/lib/services/topics.service.ts`
   - Validation schemas w `src/lib/validators/topics.validators.ts`

2. **Bezpieczeństwo:**
   - JWT authentication przez Supabase
   - RLS policies na poziomie bazy danych
   - Zod validation dla input sanitization

3. **Error Handling:**
   - Comprehensive error responses
   - Proper HTTP status codes
   - Server-side logging

4. **Performance:**
   - Minimalna liczba database queries (1 INSERT)
   - Connection pooling przez Supabase
   - Stateless API routes (łatwe skalowanie)

### Następne kroki (po implementacji)

1. Implementacja pozostałych endpoints dla Topics:
   - GET /api/topics (list)
   - GET /api/topics/:id (single)
   - PUT /api/topics/:id (update)
   - DELETE /api/topics/:id (delete)

2. Frontend integration:
   - Utworzenie React form dla tworzenia topics
   - Client-side validation (React Hook Form + Zod)
   - Error handling i user feedback

3. Monitoring i analytics:
   - Tracking response times
   - Error rate monitoring
   - Usage analytics

4. Dokumentacja API (OpenAPI/Swagger):
   - Generowanie dokumentacji z typów TypeScript
   - Interactive API explorer

---

**Plan utworzony:** 2025-11-06  
**Wersja:** 1.0  
**Endpoint:** POST /api/topics  
**Status:** Ready for implementation

