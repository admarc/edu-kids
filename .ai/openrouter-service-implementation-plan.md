# OpenRouter Service Implementation Plan

Below is a comprehensive guide to implementing an OpenRouter service in our Astro/TypeScript/React stack, integrating with the OpenRouter API for LLM-based chat completions.

## 1. Opis usługi
Opracujemy klasę `OpenRouterService`, odpowiedzialną za komunikację z API OpenRouter w celu realizacji czatów z LLM. Usługa umożliwi:
- Konfigurowanie komunikatu systemowego i użytkownika.
- Wysyłanie wiadomości do wybranego modelu LLM.
- Odbieranie odpowiedzi z ustrukturyzowanym formatem JSON.
- Obsługę błędów i logowanie.

## 2. Opis konstruktora
Konstruktor klasy przyjmuje następujące parametry:
```ts
constructor(
  apiKey: string,                   // Klucz API OpenRouter, przechowywany w zmiennych środowiskowych
  options?: {
    apiUrl?: string;               // Url punktu końcowego (domyślnie https://openrouter.ai/api)
    defaultModel?: string;         // Domyślna nazwa modelu
    defaultParams?: Record<string, any>; // Domyślne parametry modelu (temperature, max_tokens)
  }
)
```
- Inicjalizuje nagłówek Autoryzacji.
- Ustawia domyślne wartości endpointu i parametrów.

## 3. Publiczne metody i pola

### sendChat(messages, responseFormat?, model?, params?)
Opis: Wysyła tablicę komunikatów (system + użytkownik) do API i zwraca sparsowaną odpowiedź.
Parametry:
- `messages: ChatMessage[]` – tablica obiektów `{ role: 'system'|'user', content: string }`.
- `responseFormat?: ResponseFormat` – schemat JSON:
  ```ts
  type ResponseFormat = {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict: boolean;
      schema: Record<string, any>;
    };
  };
  ```
- `model?: string` – nazwa modelu, np. `'gpt-4o-mini'`.
- `params?: Record<string, any>` – parametry modelu, np. `{ temperature: 0.7, max_tokens: 150 }`.

Zwraca: `Promise<any>` – odpowiedź sparsowana według `responseFormat.schema`.

### configure(options)
Opis: Aktualizuje wartości domyślne `defaultModel` i `defaultParams`.

### fields
- `apiKey: string`
- `apiUrl: string`
- `defaultModel: string`
- `defaultParams: Record<string, any>`

## 4. Prywatne metody i pola

### formatPayload(messages, responseFormat, model, params)
Tworzy obiekt żądania zgodny z oczekiwaniami OpenRouter API.

### parseResponse(response, responseFormat)
Parsuje odpowiedź JSON, waliduje schemat i zwraca zwalidowane dane.

### handleError(error)
Standardowa obsługa błędów HTTP, JSON, walidacji i logowanie.

## 5. Obsługa błędów
Potencjalne scenariusze:
1. Błąd sieciowy (timeout, brak połączenia).
2. HTTP 4xx/5xx z API OpenRouter.
3. Nieprawidłowy JSON w odpowiedzi.
4. Niezgodność odpowiedzi z `json_schema`.
5. Brak klucza API lub nieprawidłowa autoryzacja.

Każdy z powyższych jest obsługiwany w `handleError`, zwracając przyjazny użytkownikowi komunikat i logując szczegóły.

## 6. Kwestie bezpieczeństwa
- Przechowywanie `apiKey` tylko w zmiennych środowiskowych.
- Unikanie wycieku klucza do frontendu (usługa działa tylko po stronie serwera w `/src/lib/services`).
- Limitowanie wywołań (rate limiting) i debouncing.
- Walidacja i sanitacja danych wejściowych komunikatów.
- Zabezpieczenie punktu końcowego API (CORS, CSRF).

## 7. Plan wdrożenia krok po kroku
1. Zainstaluj zależność HTTP, np. `npm install axios`.
2. Utwórz plik `/src/lib/services/openrouter.service.ts`.
3. Zaimportuj Axios (`import axios from 'axios'`) i dodaj typy w `/src/types.ts`:
   ```ts
   export interface ChatMessage { role: 'system'|'user'; content: string; }
   export interface ResponseFormat { type: 'json_schema'; json_schema: { name: string; strict: boolean; schema: Record<string, any> } }
   ```
4. Zaimplementuj klasę `OpenRouterService` zgodnie z dokumentacją:
   - Konstruktor, pola.
   - Publiczne metody: `sendChat`, `configure`.
   - Prywatne metody: `formatPayload`, `parseResponse`, `handleError`.
5. Dodaj przykładowe wywołanie w `/src/lib/hooks/useOpenRouter.ts` lub w istniejących hookach:
   ```ts
   const service = new OpenRouterService(process.env.OPENROUTER_API_KEY!);
   const response = await service.sendChat(
     [ { role: 'system', content: 'You are a helpful assistant.' },
       { role: 'user', content: 'Explain quantum mechanics in simple terms.' } ],
     { type: 'json_schema', json_schema: { name: 'QMExplanation', strict: true, schema: { explanation: 'string' } } },
     'gpt-4o-mini',
     { temperature: 0.5, max_tokens: 200 }
   );
   ```
6. Przetestuj scenariusze sukcesu i błędów.
7. Dodaj dokumentację w `README.md` (konfiguracja zmiennych środowiskowych).
8. Wdróż aplikację na DigitalOcean/GitHub Actions.

---

**Przykłady elementów:**
1. Komunikat systemowy:
   ```json
   { "role": "system", "content": "You are a helpful assistant." }
   ```
2. Komunikat użytkownika:
   ```json
   { "role": "user", "content": "What is the capital of France?" }
   ```
3. `response_format`:
   ```json
   {
     "type": "json_schema",
     "json_schema": {
       "name": "LocationAnswer",
       "strict": true,
       "schema": { "capital": "string", "country": "string" }
     }
   }
   ```
4. Nazwa modelu: `"gpt-4o-mini"`
5. Parametry modelu:
   ```json
   { "temperature": 0.7, "max_tokens": 100 }
   ```

Ten przewodnik można dostosować do innych wariantów modeli i parametrów oraz rozbudować o dodatkowe testy i integracje.
