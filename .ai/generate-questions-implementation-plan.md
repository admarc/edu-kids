# API Endpoint Implementation Plan: POST /api/questions/generate

## 1. Przegląd punktu końcowego
Generowanie zestawu pytań AI dla określonej grupy wiekowej i tematu, zapisanie ich w bazie jako `pending` dla uwierzytelnionego użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/questions/generate`
- Parametry:
  - Wymagane:
    - `age_group`: number
    - `topic_id`: number
    - `count`: number (1–10)
  - Opcjonalne: brak
- Request Body (JSON):

  ```json
  {
    "age_group": number,
    "topic_id": number,
    "count": number
  }
  ```

## 3. Wykorzystywane typy
- `GenerateQuestionsCommand` (DTO z `src/types.ts`)
- `GeneratedQuestionDto` (DTO z `src/types.ts`)

## 4. Szczegóły odpowiedzi
- 201 Created: zwraca tablicę `GeneratedQuestionDto[]`:
  ```json
  [
    { "id": number, "content": string, "status": "pending" },
    ...
  ]
  ```
- 400 Bad Request: niepoprawne dane wejściowe (ZodError)
- 401 Unauthorized: brak lub nieprawidłowy token
- 404 Not Found: temat nie istnieje lub nie należy do użytkownika
- 500 Internal Server Error: błąd serwera, AI lub bazy danych

## 5. Przepływ danych
1. Odczyt `request.body` i walidacja z Zod (schema w `src/lib/validators/questions.validators.ts`).
2. Pobranie `userId` z `locals.supabase` (middleware zapewnia sesję).
3. Weryfikacja własności tematu: sprawdzenie w tabeli `topics`, czy `user_id === userId`.
4. Wywołanie zewnętrznej usługi AI (Openrouter.ai) w `QuestionsService.generateQuestions`:
   - Parametry: `age_group`, `topic_id`, `count`
   - Otrzymanie listy wygenerowanych treści
5. Batch insert do tabeli `questions`:
   - Pola: `user_id`, `topic_id`, `age_group`, `content`, `status: 'pending'`
6. Zwrócenie wstawionych rekordów jako `GeneratedQuestionDto[]` z kodem 201.

## 6. Względy bezpieczeństwa
- Endpoint chroniony middlewarem Astro (autentykacja Supabase).
- Autoryzacja: upewnić się, że `topic_id` należy do zalogowanego użytkownika.
- Walidacja wejścia i ograniczenie `count` do 1–10.
- W przyszłości dodać rate limiting dla ochrony przed nadużyciami.

## 7. Obsługa błędów
| Kod  | Przyczyna                                    | Akcja                             |
|------|----------------------------------------------|-----------------------------------|
| 400  | Niewłaściwe dane (ZodError)                  | Zwróć JSON z opisem błędów schema  |
| 401  | Brak lub nieprawidłowy token                 | Zwróć { error: 'Unauthorized' }   |
| 404  | `topic_id` nie istnieje lub nie należy do user | Zwróć { error: 'Not Found' }      |
| 500  | Błąd AI, bazy lub nieoczekiwany wyjątek      | Zwróć { error: 'Internal Server Error' } |

## 8. Rozważania dotyczące wydajności
- Batch insert wielu pytań za jednym zapytaniem.
- Limit czasowy i timeout przy wywołaniu AI.
- Rozważ asynchroniczne zadania (job queue) do generowania dużych zestawów.

## 9. Kroki implementacji
1. Utworzyć Zod schema w `src/lib/validators/questions.validators.ts`.
2. Stworzyć `QuestionsService` w `src/lib/services/questions.service.ts` z metodą `generateQuestions`.
3. Utworzyć endpoint API w `src/pages/api/questions/generate.ts`:
   - `export const prerender = false`
   - `export async function POST({ request, locals })`
   - Walidacja, autoryzacja, wywołanie serwisu, insert, zwrot odpowiedzi.
4. Zaimplementować połączenie z Openrouter.ai (klient AI) w serwisie.
5. Dodać testy jednostkowe dla walidacji i serwisu.
6. Zaktualizować dokumentację w README.
7. Uruchomić linter, fix ewentualne błędy.
8. Przetestować integracyjnie z bazą Supabase.
