# Plan implementacji widoku Generuj pytania

## 1. Przegląd

Widok "Generuj pytania" umożliwia użytkownikom generowanie zestawu pytań dostosowanych do wieku dziecka na wybrany temat przy użyciu sztucznej inteligencji. Użytkownik wybiera grupę wiekową, temat z listy swoich tematów, określa liczbę pytań (maksymalnie 10), a następnie system generuje propozycje pytań ze statusem "pending". Każde wygenerowane pytanie może być następnie zaakceptowane, odrzucone lub edytowane.

Widok obsługuje stany ładowania, wyświetla komunikaty o błędach z możliwością ponowienia operacji oraz zapewnia responsywny interfejs użytkownika zgodny z wymaganiami PRD.

## 2. Routing widoku

- **Ścieżka:** `/generate`
- **Typ:** Strona kliencka (client-side page)
- **Framework:** Astro z komponentami React dla interaktywnych części

## 3. Struktura komponentów

```
GenerateQuestionsPage (Astro)
└── GenerateQuestionsView (React)
    ├── QuestionGeneratorForm (React)
    │   ├── AgeGroupSelect (Shadcn Select)
    │   ├── TopicSelect (Shadcn Select)
    │   ├── QuestionCountInput (Shadcn Slider/Input)
    │   └── GenerateButton (Shadcn Button)
    ├── LoadingSpinner (React/Shadcn)
    ├── ErrorAlert (React/Shadcn Toast)
    └── GeneratedQuestionsList (React)
        └── QuestionCard[] (React/Shadcn Card)
            ├── QuestionContent (React)
            ├── AcceptButton (Shadcn Button)
            ├── RejectButton (Shadcn Button)
            └── EditButton (Shadcn Button)
```

## 4. Szczegóły komponentów

### 4.1 GenerateQuestionsPage (Astro)

**Opis:** Główny plik strony Astro, który renderuje layout i osadza główny komponent React odpowiedzialny za logikę widoku.

**Główne elementy:**
- Layout z nagłówkiem strony
- Kontener dla komponentu React `GenerateQuestionsView`
- Meta tags i tytuł strony

**Obsługiwane interakcje:** Brak (tylko kontener)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak (plik strony)

---

### 4.2 GenerateQuestionsView (React)

**Opis:** Główny komponent React zarządzający całym stanem widoku generowania pytań. Odpowiada za komunikację z API, zarządzanie stanem formularza, obsługę błędów oraz wyświetlanie wyników.

**Główne elementy:**
- Kontener główny (`<div>` z odpowiednimi klasami Tailwind)
- `QuestionGeneratorForm` - formularz generowania
- `LoadingSpinner` - wyświetlany podczas ładowania
- `ErrorAlert` - komunikaty o błędach
- `GeneratedQuestionsList` - lista wygenerowanych pytań

**Obsługiwane interakcje:**
- Inicjalizacja: pobieranie listy tematów użytkownika
- Submit formularza: wywołanie API generowania pytań
- Retry: ponowienie żądania po błędzie
- Accept/Reject/Edit: przekazanie obsługi do komponentów dzieci

**Obsługiwana walidacja:**
- Sprawdzenie czy użytkownik ma dostępne tematy przed wyświetleniem formularza
- Walidacja odpowiedzi API
- Obsługa błędów sieci

**Typy:**
- `GenerateQuestionsFormData` (ViewModel)
- `GeneratedQuestionDto` (z types.ts)
- `TopicDto` (z types.ts)
- `GenerateQuestionsCommand` (z types.ts)

**Propsy:** Brak (top-level component)

---

### 4.3 QuestionGeneratorForm (React)

**Opis:** Formularz umożliwiający użytkownikowi konfigurację parametrów generowania pytań. Składa się z pól wyboru grupy wiekowej, tematu oraz liczby pytań do wygenerowania.

**Główne elementy:**
- `<form>` element z obsługą submit
- `AgeGroupSelect` - dropdown wyboru grupy wiekowej
- `TopicSelect` - dropdown wyboru tematu
- `QuestionCountInput` - slider/input do wyboru liczby pytań
- `GenerateButton` - przycisk submit

**Obsługiwane interakcje:**
- Zmiana wartości w polach formularza
- Submit formularza (generowanie pytań)
- Walidacja po stronie klienta przed wysłaniem

**Obsługiwana walidacja:**
- Grupa wiekowa: wymagana, liczba całkowita > 0
- Temat: wymagany, musi istnieć na liście dostępnych tematów użytkownika
- Liczba pytań: wymagana, liczba całkowita, min: 1, max: 10

**Typy:**
- `GenerateQuestionsFormData` (ViewModel)
- `TopicDto[]` (lista dostępnych tematów)
- `AgeGroup` (typ pomocniczy dla grup wiekowych)

**Propsy:**
```typescript
interface QuestionGeneratorFormProps {
  topics: TopicDto[];
  isLoading: boolean;
  onSubmit: (data: GenerateQuestionsFormData) => Promise<void>;
}
```

---

### 4.4 AgeGroupSelect (Shadcn Select)

**Opis:** Komponent dropdown do wyboru grupy wiekowej dziecka. Wykorzystuje komponent Select z Shadcn/ui z predefiniowanymi opcjami grup wiekowych.

**Główne elementy:**
- Shadcn `Select` component
- `SelectTrigger` - przycisk otwierający dropdown
- `SelectContent` - lista opcji
- `SelectItem[]` - poszczególne opcje grup wiekowych

**Obsługiwane interakcje:**
- Otwieranie/zamykanie dropdown
- Wybór grupy wiekowej
- Aktualizacja stanu formularza

**Obsługiwana walidacja:**
- Wymagane pole (nie może być puste)
- Musi być liczbą całkowitą dodatnią

**Typy:**
- `AgeGroup` (ViewModel)
- `number` (wartość wybranej grupy)

**Propsy:**
```typescript
interface AgeGroupSelectProps {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

---

### 4.5 TopicSelect (Shadcn Select)

**Opis:** Komponent dropdown do wyboru tematu z listy tematów użytkownika. Wyświetla dostępne tematy pobrane z API.

**Główne elementy:**
- Shadcn `Select` component
- `SelectTrigger` - przycisk z nazwą wybranego tematu
- `SelectContent` - lista dostępnych tematów
- `SelectItem[]` - poszczególne tematy jako opcje

**Obsługiwane interakcje:**
- Otwieranie/zamykanie dropdown
- Wybór tematu
- Aktualizacja stanu formularza
- Obsługa pustej listy tematów (komunikat)

**Obsługiwana walidacja:**
- Wymagane pole
- Musi być ID istniejącego tematu należącego do użytkownika
- Topic ID musi być liczbą całkowitą dodatnią

**Typy:**
- `TopicDto[]` (lista tematów)
- `number` (ID wybranego tematu)

**Propsy:**
```typescript
interface TopicSelectProps {
  topics: TopicDto[];
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

---

### 4.6 QuestionCountInput (Shadcn Slider/Input)

**Opis:** Komponent do wyboru liczby pytań do wygenerowania. Może być zrealizowany jako slider z towarzyszącym polem numerycznym lub jako standalone input number.

**Główne elementy:**
- Shadcn `Slider` lub `Input` type="number"
- Label z aktualną wartością
- Wskazówki min/max (1-10)

**Obsługiwane interakcje:**
- Zmiana wartości przez slider/input
- Aktualizacja stanu formularza
- Walidacja w czasie rzeczywistym

**Obsługiwana walidacja:**
- Wymagane pole
- Liczba całkowita
- Minimum: 1
- Maximum: 10

**Typy:**
- `number` (wartość liczby pytań)

**Propsy:**
```typescript
interface QuestionCountInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number; // default: 1
  max?: number; // default: 10
}
```

---

### 4.7 GenerateButton (Shadcn Button)

**Opis:** Przycisk submit formularza inicjujący proces generowania pytań przez API.

**Główne elementy:**
- Shadcn `Button` component
- Tekst "Generuj pytania"
- Opcjonalna ikona
- Loading state (spinner w przycisku)

**Obsługiwane interakcje:**
- Click - submit formularza
- Disabled state podczas ładowania

**Obsługiwana walidacja:**
- Przycisk nieaktywny gdy formularz jest niepoprawny
- Przycisk nieaktywny podczas ładowania

**Typy:** Brak specyficznych

**Propsy:**
```typescript
interface GenerateButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
```

---

### 4.8 LoadingSpinner (React/Shadcn)

**Opis:** Komponent wyświetlający animowany spinner podczas oczekiwania na odpowiedź API. Pojawia się po kliknięciu "Generuj" i znika po otrzymaniu wyników lub błędu.

**Główne elementy:**
- Kontener z animowaną ikoną spinner
- Opcjonalny tekst "Generowanie pytań..."
- Overlay (opcjonalnie) blokujący interakcje

**Obsługiwane interakcje:** Brak (tylko wizualny feedback)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface LoadingSpinnerProps {
  message?: string;
}
```

---

### 4.9 ErrorAlert (React/Shadcn Toast)

**Opis:** Komponent wyświetlający komunikaty o błędach z możliwością ponowienia operacji. Wykorzystuje system Toast z Shadcn/ui.

**Główne elementy:**
- Shadcn `Toast` lub `Alert` component
- Ikona błędu
- Komunikat błędu
- Przycisk "Spróbuj ponownie"
- Przycisk zamknięcia (X)

**Obsługiwane interakcje:**
- Kliknięcie "Spróbuj ponownie" - wywołanie retry
- Kliknięcie X - zamknięcie alertu
- Auto-dismiss po określonym czasie (opcjonalnie)

**Obsługiwana walidacja:** Brak

**Typy:**
- `ErrorType` (ViewModel dla różnych typów błędów)

**Propsy:**
```typescript
interface ErrorAlertProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss: () => void;
}
```

---

### 4.10 GeneratedQuestionsList (React)

**Opis:** Komponent wyświetlający listę wygenerowanych pytań. Każde pytanie jest renderowane w osobnym komponencie `QuestionCard`.

**Główne elementy:**
- Kontener listy (`<div>` lub `<ul>`)
- Nagłówek z liczbą wygenerowanych pytań
- Array `QuestionCard` components
- Empty state gdy brak pytań

**Obsługiwane interakcje:**
- Renderowanie listy pytań
- Przekazywanie akcji do kart pytań

**Obsługiwana walidacja:**
- Sprawdzenie czy lista nie jest pusta

**Typy:**
- `GeneratedQuestionDto[]` (lista pytań)

**Propsy:**
```typescript
interface GeneratedQuestionsListProps {
  questions: GeneratedQuestionDto[];
  onAccept: (questionId: number) => Promise<void>;
  onReject: (questionId: number) => void;
  onEdit: (questionId: number, newContent: string) => Promise<void>;
}
```

---

### 4.11 QuestionCard (React/Shadcn Card)

**Opis:** Komponent karty pojedynczego wygenerowanego pytania z opcjami akceptacji, odrzucenia lub edycji.

**Główne elementy:**
- Shadcn `Card` component
- `CardHeader` z numerem pytania
- `CardContent` z treścią pytania
- `CardFooter` z przyciskami akcji:
  - `AcceptButton` - zaakceptuj pytanie
  - `RejectButton` - odrzuć pytanie
  - `EditButton` - edytuj pytanie (inline lub modal)
- Tryb edycji (textarea + save/cancel)

**Obsługiwane interakcje:**
- Click Accept - zmiana statusu na "accepted" i zapis do bazy
- Click Reject - usunięcie pytania z listy (lokalnie)
- Click Edit - przejście w tryb edycji
- Save Edit - aktualizacja treści i zapis
- Cancel Edit - powrót do widoku

**Obsługiwana walidacja:**
- W trybie edycji: treść pytania nie może być pusta
- Minimum 1 znak treści

**Typy:**
- `GeneratedQuestionDto` (pojedyncze pytanie)
- `QuestionCardMode` = "view" | "edit" (ViewModel)

**Propsy:**
```typescript
interface QuestionCardProps {
  question: GeneratedQuestionDto;
  index: number; // do wyświetlenia numeru
  onAccept: (questionId: number) => Promise<void>;
  onReject: (questionId: number) => void;
  onEdit: (questionId: number, newContent: string) => Promise<void>;
}
```

---

### 4.12 AcceptButton (Shadcn Button)

**Opis:** Przycisk akceptacji pytania. Po kliknięciu pytanie jest zapisywane w bazie danych ze statusem "accepted".

**Główne elementy:**
- Shadcn `Button` variant="default" lub "primary"
- Ikona check/checkmark
- Tekst "Zatwierdź" lub "Akceptuj"

**Obsługiwane interakcje:**
- Click - wywołanie callback onAccept
- Loading state podczas zapisu

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface AcceptButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}
```

---

### 4.13 RejectButton (Shadcn Button)

**Opis:** Przycisk odrzucenia pytania. Po kliknięciu pytanie jest usuwane z listy (lokalnie, bez zapisu do bazy).

**Główne elementy:**
- Shadcn `Button` variant="destructive" lub "ghost"
- Ikona X lub trash
- Tekst "Odrzuć"

**Obsługiwane interakcje:**
- Click - wywołanie callback onReject
- Pytanie znika z listy

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface RejectButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 4.14 EditButton (Shadcn Button)

**Opis:** Przycisk przełączający kartę pytania w tryb edycji, umożliwiający użytkownikowi modyfikację treści pytania przed zatwierdzeniem.

**Główne elementy:**
- Shadcn `Button` variant="outline" lub "secondary"
- Ikona edit/pencil
- Tekst "Edytuj"

**Obsługiwane interakcje:**
- Click - przełączenie karty w tryb edycji
- Wyświetlenie textarea z treścią

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

**GeneratedQuestionDto** - reprezentuje pojedyncze wygenerowane pytanie
```typescript
interface GeneratedQuestionDto {
  id: number;
  content: string;
  status: "pending";
}
```

**TopicDto** - reprezentuje temat użytkownika
```typescript
interface TopicDto {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

**GenerateQuestionsCommand** - dane wysyłane do API
```typescript
interface GenerateQuestionsCommand {
  age_group: number;
  topic_id: number;
  count: number; // max 10
}
```

**GeneratedQuestionsResponseDto** - odpowiedź z API
```typescript
type GeneratedQuestionsResponseDto = GeneratedQuestionDto[];
```

### 5.2 Nowe typy ViewModel (do utworzenia)

**GenerateQuestionsFormData** - stan formularza generowania
```typescript
interface GenerateQuestionsFormData {
  age_group: number | undefined;
  topic_id: number | undefined;
  count: number;
}
```
Pola:
- `age_group`: wybrana grupa wiekowa (undefined przed wyborem)
- `topic_id`: ID wybranego tematu (undefined przed wyborem)
- `count`: liczba pytań do wygenerowania (domyślnie 5, zakres 1-10)

**AgeGroup** - reprezentacja grupy wiekowej dla UI
```typescript
interface AgeGroup {
  value: number;
  label: string; // np. "3-4 lata", "5-6 lat"
}
```
Pola:
- `value`: wartość numeryczna grupy wiekowej (np. 3, 4, 5, 6, 7, 8, 9, 10)
- `label`: czytelny opis dla użytkownika

Lista stałych grup wiekowych:
```typescript
const AGE_GROUPS: AgeGroup[] = [
  { value: 3, label: "3-4 lata" },
  { value: 5, label: "5-6 lat" },
  { value: 7, label: "7-8 lat" },
  { value: 9, label: "9-10 lat" },
  { value: 11, label: "11-12 lat" },
];
```

**QuestionCardMode** - tryb wyświetlania karty pytania
```typescript
type QuestionCardMode = "view" | "edit";
```

**ErrorType** - typy błędów do obsługi
```typescript
interface ErrorType {
  type: "network" | "validation" | "server" | "not_found";
  message: string;
  retryable: boolean;
}
```
Pola:
- `type`: typ błędu (network - problem z siecią, validation - błąd walidacji, server - błąd serwera, not_found - temat nie znaleziony)
- `message`: komunikat dla użytkownika
- `retryable`: czy można ponowić operację

**QuestionCardState** - stan pojedynczej karty pytania
```typescript
interface QuestionCardState {
  mode: QuestionCardMode;
  editedContent: string;
  isAccepting: boolean;
  isEditing: boolean;
}
```
Pola:
- `mode`: aktualny tryb karty (view/edit)
- `editedContent`: tymczasowa wartość podczas edycji
- `isAccepting`: czy trwa proces akceptacji (loading)
- `isEditing`: czy trwa proces edycji (loading)

**GenerateQuestionsViewState** - główny stan widoku
```typescript
interface GenerateQuestionsViewState {
  topics: TopicDto[];
  formData: GenerateQuestionsFormData;
  generatedQuestions: GeneratedQuestionDto[];
  isLoadingTopics: boolean;
  isGenerating: boolean;
  error: ErrorType | null;
}
```
Pola:
- `topics`: lista dostępnych tematów użytkownika
- `formData`: dane formularza generowania
- `generatedQuestions`: lista wygenerowanych pytań
- `isLoadingTopics`: czy trwa ładowanie listy tematów
- `isGenerating`: czy trwa generowanie pytań
- `error`: aktualny błąd (jeśli wystąpił)

## 6. Zarządzanie stanem

### 6.1 Stan główny widoku

Stan widoku jest zarządzany w komponencie `GenerateQuestionsView` przy użyciu React hooks. Ze względu na złożoność logiki, zalecane jest utworzenie custom hooka `useGenerateQuestions`.

### 6.2 Custom Hook: useGenerateQuestions

**Lokalizacja:** `src/lib/hooks/useGenerateQuestions.ts`

**Odpowiedzialności:**
- Zarządzanie stanem formularza
- Pobieranie listy tematów przy montowaniu komponentu
- Wysyłanie żądania generowania pytań do API
- Obsługa błędów i retry
- Zarządzanie listą wygenerowanych pytań
- Obsługa akcji accept/reject/edit na pytaniach

**Zwracane wartości:**
```typescript
interface UseGenerateQuestionsReturn {
  // Stan
  topics: TopicDto[];
  formData: GenerateQuestionsFormData;
  generatedQuestions: GeneratedQuestionDto[];
  isLoadingTopics: boolean;
  isGenerating: boolean;
  error: ErrorType | null;
  
  // Akcje formularza
  updateFormData: (field: keyof GenerateQuestionsFormData, value: any) => void;
  handleSubmit: () => Promise<void>;
  
  // Akcje pytań
  handleAccept: (questionId: number) => Promise<void>;
  handleReject: (questionId: number) => void;
  handleEdit: (questionId: number, newContent: string) => Promise<void>;
  
  // Obsługa błędów
  clearError: () => void;
  retryGeneration: () => Promise<void>;
}
```

**Implementacja (szkic):**
```typescript
export function useGenerateQuestions() {
  const [state, setState] = useState<GenerateQuestionsViewState>({
    topics: [],
    formData: {
      age_group: undefined,
      topic_id: undefined,
      count: 5,
    },
    generatedQuestions: [],
    isLoadingTopics: false,
    isGenerating: false,
    error: null,
  });

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setState(prev => ({ ...prev, isLoadingTopics: true }));
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        topics: data.data || [], 
        isLoadingTopics: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoadingTopics: false,
        error: {
          type: 'network',
          message: 'Nie udało się pobrać listy tematów',
          retryable: true,
        }
      }));
    }
  };

  const handleSubmit = async () => {
    // Walidacja
    if (!state.formData.age_group || !state.formData.topic_id) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'validation',
          message: 'Wypełnij wszystkie pola formularza',
          retryable: false,
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age_group: state.formData.age_group,
          topic_id: state.formData.topic_id,
          count: state.formData.count,
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się wygenerować pytań');
      }

      const questions = await response.json();
      setState(prev => ({
        ...prev,
        generatedQuestions: questions,
        isGenerating: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: {
          type: 'server',
          message: error.message,
          retryable: true,
        }
      }));
    }
  };

  // Pozostałe funkcje...

  return {
    topics: state.topics,
    formData: state.formData,
    generatedQuestions: state.generatedQuestions,
    isLoadingTopics: state.isLoadingTopics,
    isGenerating: state.isGenerating,
    error: state.error,
    updateFormData,
    handleSubmit,
    handleAccept,
    handleReject,
    handleEdit,
    clearError,
    retryGeneration,
  };
}
```

### 6.3 Stan lokalny w QuestionCard

Każda karta pytania (`QuestionCard`) zarządza własnym lokalnym stanem dla trybu edycji:
- `mode`: "view" | "edit"
- `editedContent`: string (tymczasowa wartość)
- `isAccepting`: boolean (loading state)

## 7. Integracja API

### 7.1 Endpoint: GET /api/topics

**Cel:** Pobranie listy tematów użytkownika do wyboru w formularzu

**Request:**
- Metoda: GET
- Headers: Content-Type: application/json
- Body: Brak
- Query params: Brak (w przyszłości pagination)

**Response Success (200):**
```typescript
{
  data: TopicDto[];
  pagination: PaginationDto; // w przyszłości
}
```

**Response Error:**
- 401: Unauthorized
- 500: Server error

**Obsługa błędów:**
- Network error: wyświetl toast z możliwością retry
- 401: przekierowanie do logowania
- 500: wyświetl toast z informacją o problemie

**Moment wywołania:** Przy montowaniu komponentu `GenerateQuestionsView` (useEffect)

### 7.2 Endpoint: POST /api/questions/generate

**Cel:** Wygenerowanie zestawu pytań AI

**Request:**
- Metoda: POST
- Headers: Content-Type: application/json
- Body: `GenerateQuestionsCommand`
```typescript
{
  age_group: number;    // wartość z formularza
  topic_id: number;     // ID wybranego tematu
  count: number;        // 1-10
}
```

**Response Success (201):**
```typescript
GeneratedQuestionsResponseDto = GeneratedQuestionDto[]
// np.:
[
  {
    id: 123,
    content: "Jakie jest ulubione jedzenie żyrafy?",
    status: "pending"
  },
  {
    id: 124,
    content: "Ile nóg ma pająk?",
    status: "pending"
  }
]
```

**Response Error:**
- 400: Validation error (błędne dane wejściowe)
  ```typescript
  {
    error: "Validation error",
    details: [
      { field: "count", message: "Maksymalna liczba pytań to 10" }
    ]
  }
  ```
- 401: Unauthorized
- 404: Topic not found or doesn't belong to user
  ```typescript
  {
    error: "Not Found",
    message: "Topic not found or doesn't belong to user"
  }
  ```
- 500: Server error (AI service or database error)
  ```typescript
  {
    error: "Internal server error",
    message: "Failed to generate questions"
  }
  ```

**Obsługa błędów:**
- 400: wyświetl szczegóły walidacji w toaście, brak retry
- 404: wyświetl komunikat "Temat nie został znaleziony", odśwież listę tematów
- 500: wyświetl toast z możliwością retry
- Network error: wyświetl toast z możliwością retry

**Moment wywołania:** Po kliknięciu przycisku "Generuj pytania" w formularzu

### 7.3 Endpoint: PATCH /api/questions/:id (przyszłość)

**Uwaga:** Ten endpoint nie jest jeszcze zaimplementowany, ale będzie potrzebny do akcji accept/edit w kartach pytań.

**Cel:** Aktualizacja pytania (zmiana treści lub statusu)

**Request:**
- Metoda: PATCH
- Headers: Content-Type: application/json
- URL params: `id` (number) - ID pytania
- Body: `UpdateQuestionCommand`
```typescript
{
  content?: string;                      // nowa treść (jeśli edytowano)
  status?: "accepted" | "rejected";      // nowy status
}
```

**Response Success (200):**
```typescript
QuestionDto // zaktualizowane pytanie
```

**Obsługa:**
- Accept: wysłanie `{ status: "accepted" }`
- Edit: wysłanie `{ content: "nowa treść" }`

## 8. Interakcje użytkownika

### 8.1 Inicjalizacja widoku

**Akcja użytkownika:** Wejście na stronę `/generate`

**Przepływ:**
1. Komponent `GenerateQuestionsView` montuje się
2. Hook `useGenerateQuestions` wywołuje fetchTopics()
3. Wyświetlany jest LoadingSpinner podczas ładowania tematów
4. Po załadowaniu wyświetlany jest formularz z dostępnymi tematami
5. Jeśli użytkownik nie ma tematów, wyświetlany jest komunikat z linkiem do `/topics`

**Stan UI:**
- Loading: Spinner + "Ładowanie tematów..."
- Success: Formularz z wypełnionymi opcjami
- Error: Alert z komunikatem błędu + przycisk retry
- Empty: Komunikat "Nie masz jeszcze żadnych tematów" + link do tworzenia

### 8.2 Wypełnienie formularza

**Akcja użytkownika:** Wybór grupy wiekowej

**Przepływ:**
1. Użytkownik klika na AgeGroupSelect
2. Otwiera się dropdown z grupami wiekowymi
3. Użytkownik wybiera grupę
4. Wartość jest zapisywana w state (`formData.age_group`)
5. Dropdown się zamyka

**Stan UI:**
- Dropdown otwarty/zamknięty
- Wyświetlenie wybranej wartości w triggerze

---

**Akcja użytkownika:** Wybór tematu

**Przepływ:**
1. Użytkownik klika na TopicSelect
2. Otwiera się dropdown z tematami użytkownika
3. Użytkownik wybiera temat
4. Wartość jest zapisywana w state (`formData.topic_id`)
5. Dropdown się zamyka

**Stan UI:**
- Dropdown otwarty/zamknięty
- Wyświetlenie nazwy wybranego tematu w triggerze
- Jeśli brak tematów: disabled select + tooltip "Najpierw utwórz temat"

---

**Akcja użytkownika:** Ustawienie liczby pytań

**Przepływ:**
1. Użytkownik przesuwa slider lub wpisuje wartość w input
2. Wartość jest zapisywana w state (`formData.count`)
3. Walidacja w czasie rzeczywistym (1-10)
4. Wyświetlenie aktualnej wartości obok slidera

**Stan UI:**
- Aktualna wartość wyświetlana dynamicznie
- Blokada wartości poza zakresem 1-10
- Visual feedback przy próbie przekroczenia limitu

### 8.3 Generowanie pytań

**Akcja użytkownika:** Kliknięcie przycisku "Generuj pytania"

**Przepływ:**
1. Walidacja formularza (czy wszystkie pola wypełnione)
2. Jeśli błąd walidacji: wyświetl toast, zatrzymaj
3. Wywołanie `handleSubmit()` z hooka
4. Wyświetlenie LoadingSpinner
5. Wysłanie POST /api/questions/generate
6. Oczekiwanie na odpowiedź (może potrwać kilka sekund)
7. Po sukcesie: ukrycie spinnera, wyświetlenie listy pytań
8. Po błędzie: ukrycie spinnera, wyświetlenie ErrorAlert z retry

**Stan UI:**
- Loading: 
  - Button disabled z spinnerem wewnątrz
  - Cały formularz disabled
  - Dodatkowy LoadingSpinner z komunikatem "Generowanie pytań..."
- Success:
  - Formularz pozostaje widoczny (możliwość kolejnego generowania)
  - Poniżej pojawia się lista wygenerowanych pytań
  - Smooth scroll do listy pytań
- Error:
  - Toast/Alert z komunikatem błędu
  - Przycisk "Spróbuj ponownie"
  - Formularz pozostaje wypełniony

### 8.4 Akcje na wygenerowanych pytaniach

**Akcja użytkownika:** Kliknięcie "Akceptuj" na pytaniu

**Przepływ:**
1. Wywołanie `handleAccept(questionId)`
2. Loading state w przycisku Accept
3. Wysłanie PATCH /api/questions/:id z `{ status: "accepted" }`
4. Po sukcesie:
   - Wyświetlenie toast "Pytanie zaakceptowane"
   - Pytanie znika z listy lub zmienia kolor na zielony (do decyzji UX)
   - Możliwość: przeniesienie do sekcji "Zaakceptowane pytania"
5. Po błędzie:
   - Toast z komunikatem błędu
   - Pytanie pozostaje na liście

**Stan UI:**
- Loading: Przycisk Accept z spinnerem, disabled
- Success: Pytanie znika lub zmienia wygląd
- Error: Toast z błędem

---

**Akcja użytkownika:** Kliknięcie "Odrzuć" na pytaniu

**Przepływ:**
1. Wywołanie `handleReject(questionId)`
2. Pytanie natychmiast znika z listy (lokalna operacja, bez API)
3. Opcjonalnie: animacja fade-out
4. Liczba pytań w nagłówku listy aktualizuje się

**Stan UI:**
- Pytanie znika z animacją
- Lista pozostałych pytań przesuwa się do góry

---

**Akcja użytkownika:** Kliknięcie "Edytuj" na pytaniu

**Przepływ:**
1. Karta pytania przechodzi w tryb edycji
2. Treść pytania zamienia się na textarea
3. Przyciski Accept/Reject/Edit zastępowane przez Save/Cancel
4. Użytkownik edytuje treść
5. Kliknięcie Save:
   - Walidacja (niepusta treść)
   - Wywołanie `handleEdit(questionId, newContent)`
   - Wysłanie PATCH /api/questions/:id z `{ content: "nowa treść" }`
   - Po sukcesie: powrót do trybu view, zaktualizowana treść
   - Po błędzie: toast, pozostanie w trybie edit
6. Kliknięcie Cancel:
   - Powrót do trybu view
   - Przywrócenie oryginalnej treści

**Stan UI:**
- Edit mode:
  - Textarea z pełną treścią pytania
  - Przyciski Save (primary) i Cancel (secondary)
- Saving:
  - Przyciski disabled
  - Spinner w przycisku Save
- Success:
  - Powrót do view mode
  - Zaktualizowana treść
- Error:
  - Toast z błędem
  - Pozostanie w edit mode

### 8.5 Retry po błędzie

**Akcja użytkownika:** Kliknięcie "Spróbuj ponownie" w ErrorAlert

**Przepływ:**
1. Wywołanie `retryGeneration()` z hooka
2. Powtórzenie ostatniego żądania z tymi samymi parametrami
3. Obsługa jak w punkcie 8.3

**Stan UI:**
- Alert znika
- Pojawia się LoadingSpinner
- Dalszy przepływ jak przy standardowym generowaniu

## 9. Warunki i walidacja

### 9.1 Walidacja formularza (przed wysłaniem do API)

**Komponent:** `QuestionGeneratorForm`

**Warunki:**

1. **Grupa wiekowa (`age_group`):**
   - Wymagane pole (nie może być undefined)
   - Musi być liczbą całkowitą
   - Musi być > 0
   - Musi być jedną z predefiniowanych wartości (3, 5, 7, 9, 11)
   - **Wpływ na UI:** Przycisk "Generuj" disabled jeśli nie wybrano

2. **Temat (`topic_id`):**
   - Wymagane pole (nie może być undefined)
   - Musi być liczbą całkowitą
   - Musi być > 0
   - Musi istnieć na liście tematów użytkownika
   - **Wpływ na UI:** Przycisk "Generuj" disabled jeśli nie wybrano
   - **Dodatkowy warunek:** Jeśli użytkownik nie ma żadnych tematów, cały formularz disabled + komunikat

3. **Liczba pytań (`count`):**
   - Wymagane pole
   - Musi być liczbą całkowitą
   - Minimum: 1
   - Maximum: 10
   - **Wpływ na UI:** Input/slider blokuje wartości poza zakresem, przycisk "Generuj" disabled przy nieprawidłowej wartości

**Implementacja walidacji:**
```typescript
const isFormValid = (): boolean => {
  return (
    formData.age_group !== undefined &&
    formData.age_group > 0 &&
    formData.topic_id !== undefined &&
    formData.topic_id > 0 &&
    formData.count >= 1 &&
    formData.count <= 10
  );
};
```

**Komunikaty walidacyjne:**
- Wyświetlane jako toast przy próbie submit nieprawidłowego formularza
- "Wybierz grupę wiekową"
- "Wybierz temat"
- "Liczba pytań musi być między 1 a 10"

### 9.2 Walidacja przed wywołaniem API

**Lokalizacja:** Hook `useGenerateQuestions`, funkcja `handleSubmit`

**Dodatkowe sprawdzenia:**
- Sprawdzenie połączenia internetowego (opcjonalnie)
- Sprawdzenie czy `topics.length > 0` (czy użytkownik ma jakiekolwiek tematy)
- Sprawdzenie czy wybrany `topic_id` nadal istnieje w liście tematów

**Komunikaty:**
- "Nie masz żadnych tematów. Najpierw utwórz temat." + link do `/topics`
- "Wybrany temat nie istnieje. Odśwież stronę."

### 9.3 Walidacja odpowiedzi API

**Lokalizacja:** Hook `useGenerateQuestions`, funkcja `handleSubmit`

**Sprawdzenia:**
- Czy response.ok === true
- Czy response.status === 201
- Czy odpowiedź zawiera tablicę pytań
- Czy liczba pytań w odpowiedzi zgadza się z requested count (może być mniejsza)

**Obsługa niezgodności:**
- Jeśli odpowiedź pusta: "Nie udało się wygenerować pytań. Spróbuj ponownie."
- Jeśli błąd parsowania JSON: "Otrzymano nieprawidłowe dane z serwera."

### 9.4 Walidacja edycji pytania

**Komponent:** `QuestionCard` (tryb edycji)

**Warunki:**
- Treść pytania nie może być pusta
- Minimum 1 znak (po trim)
- Maximum: brak limitu (ale zalecane ostrzeżenie przy > 500 znaków)

**Wpływ na UI:**
- Przycisk "Zapisz" disabled jeśli treść pusta
- Komunikat walidacyjny pod textarea: "Pytanie nie może być puste"

### 9.5 Walidacja dostępności funkcji

**Warunek:** Użytkownik musi mieć co najmniej jeden temat

**Sprawdzenie:** `topics.length > 0`

**Wpływ na UI:**
- Jeśli false:
  - Cały formularz disabled
  - Wyświetlenie komunikatu: "Aby generować pytania, musisz najpierw utworzyć temat."
  - Przycisk/link: "Utwórz pierwszy temat" → przekierowanie do `/topics`

**Lokalizacja:** Komponent `GenerateQuestionsView`, warunkowe renderowanie

## 10. Obsługa błędów

### 10.1 Błędy ładowania tematów (GET /api/topics)

**Scenariusz 1: Błąd sieci (Network Error)**
- **Przyczyna:** Brak internetu, server offline
- **Obsługa:**
  - Wyświetlenie toast/alert: "Nie udało się pobrać listy tematów. Sprawdź połączenie internetowe."
  - Przycisk "Spróbuj ponownie"
  - Retry wywołuje ponownie fetchTopics()
- **Stan UI:** ErrorAlert widoczny, formularz ukryty

**Scenariusz 2: Błąd 401 Unauthorized**
- **Przyczyna:** Użytkownik niezalogowany lub sesja wygasła
- **Obsługa:**
  - Przekierowanie do strony logowania
  - Toast: "Sesja wygasła. Zaloguj się ponownie."
- **Stan UI:** Redirect

**Scenariusz 3: Błąd 500 Server Error**
- **Przyczyna:** Problem po stronie serwera
- **Obsługa:**
  - Toast: "Wystąpił problem z serwerem. Spróbuj ponownie później."
  - Przycisk "Spróbuj ponownie"
- **Stan UI:** ErrorAlert widoczny

**Scenariusz 4: Pusta lista tematów (Success, ale data.length === 0)**
- **Przyczyna:** Użytkownik nie utworzył jeszcze żadnych tematów
- **Obsługa:**
  - Wyświetlenie komunikatu: "Nie masz jeszcze żadnych tematów."
  - Przycisk: "Utwórz pierwszy temat" → link do `/topics`
- **Stan UI:** Empty state, formularz niedostępny

### 10.2 Błędy generowania pytań (POST /api/questions/generate)

**Scenariusz 1: Błąd 400 Validation Error**
- **Przyczyna:** Nieprawidłowe dane wejściowe (np. count > 10)
- **Obsługa:**
  - Parsowanie `error.details` z odpowiedzi
  - Wyświetlenie toasta z konkretnymi błędami walidacji:
    - "Liczba pytań: Maksymalna liczba pytań to 10"
    - "Grupa wiekowa: Grupa wiekowa musi być liczbą dodatnią"
  - Brak przycisku retry (użytkownik musi poprawić dane)
- **Stan UI:** Toast z błędami, formularz pozostaje wypełniony

**Scenariusz 2: Błąd 404 Topic Not Found**
- **Przyczyna:** Temat został usunięty lub nie należy do użytkownika
- **Obsługa:**
  - Toast: "Wybrany temat nie został znaleziony. Odśwież listę tematów."
  - Automatyczne ponowne pobranie listy tematów (fetchTopics())
  - Reset pola `topic_id` w formularzu
- **Stan UI:** Toast, formularz z wyczyszczonym polem tematu

**Scenariusz 3: Błąd 500 Server/AI Error**
- **Przyczyna:** Problem z AI service lub bazą danych
- **Obsługa:**
  - Toast: "Nie udało się wygenerować pytań. Spróbuj ponownie."
  - Przycisk "Spróbuj ponownie"
  - Retry z tymi samymi parametrami
- **Stan UI:** ErrorAlert z retry, formularz pozostaje wypełniony

**Scenariusz 4: Network Error**
- **Przyczyna:** Timeout, brak internetu
- **Obsługa:**
  - Toast: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
  - Przycisk "Spróbuj ponownie"
- **Stan UI:** ErrorAlert z retry

**Scenariusz 5: Timeout (długie oczekiwanie)**
- **Przyczyna:** AI service działa wolno
- **Obsługa:**
  - Po 30 sekundach wyświetlenie dodatkowego komunikatu:
    "Generowanie trwa dłużej niż zwykle. Proszę czekać..."
  - Po 60 sekundach: timeout i błąd
- **Stan UI:** LoadingSpinner z dodatkowym komunikatem

### 10.3 Błędy akcji na pytaniach (PATCH /api/questions/:id)

**Scenariusz 1: Błąd akceptacji pytania**
- **Przyczyna:** Problem z zapisem do bazy, pytanie już nie istnieje
- **Obsługa:**
  - Toast: "Nie udało się zaakceptować pytania. Spróbuj ponownie."
  - Pytanie pozostaje na liście w stanie pending
  - Możliwość ponownego kliknięcia Accept
- **Stan UI:** Toast, przycisk Accept z powrotem w stanie normalnym

**Scenariusz 2: Błąd edycji pytania**
- **Przyczyna:** Problem z zapisem, walidacja po stronie serwera
- **Obsługa:**
  - Toast: "Nie udało się zapisać zmian. Spróbuj ponownie."
  - Karta pozostaje w trybie edycji
  - Użytkownik może ponownie kliknąć Save lub Cancel
- **Stan UI:** Toast, tryb edycji aktywny, przyciski odblokowane

### 10.4 Obsługa wielu błędów jednocześnie

**Strategia:**
- Kolejkowanie toastów (max 3 widoczne jednocześnie)
- Priorytetyzacja: błędy krytyczne (401) > błędy operacji > błędy walidacji
- Auto-dismiss po 5 sekundach dla błędów nieretryable
- Pozostanie do ręcznego zamknięcia dla błędów z retry

### 10.5 Edge cases

**Edge case 1: Użytkownik szybko klika "Generuj" wiele razy**
- **Obsługa:** Debouncing / przycisk disabled podczas ładowania
- **Zapobieganie:** Disable przycisku natychmiast po pierwszym kliknięciu

**Edge case 2: Użytkownik edytuje wiele pytań jednocześnie**
- **Obsługa:** Każda karta zarządza własnym stanem edycji niezależnie
- **Dozwolone:** Wielokrotna edycja różnych pytań

**Edge case 3: Lista tematów zmienia się podczas wypełniania formularza**
- **Obsługa:** Walidacja przed submit czy wybrany topic_id nadal istnieje
- **Komunikat:** "Wybrany temat nie jest już dostępny"

**Edge case 4: Użytkownik opuszcza stronę podczas generowania**
- **Obsługa:** Brak specjalnej obsługi w MVP (żądanie się wykonuje, ale użytkownik nie zobaczy wyniku)
- **Przyszłość:** Zapisanie stanu w localStorage / ostrzeżenie przed opuszczeniem

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów
1. Utworzenie pliku strony: `src/pages/generate.astro`
2. Dodanie nowych typów ViewModel do `src/types.ts`:
   - `GenerateQuestionsFormData`
   - `AgeGroup`
   - `QuestionCardMode`
   - `ErrorType`
   - `QuestionCardState`
   - `GenerateQuestionsViewState`
3. Utworzenie stałej `AGE_GROUPS` z predefiniowanymi grupami wiekowymi

### Krok 2: Utworzenie custom hooka
1. Utworzenie pliku `src/lib/hooks/useGenerateQuestions.ts`
2. Implementacja interfejsu `UseGenerateQuestionsReturn`
3. Implementacja zarządzania stanem za pomocą `useState`
4. Implementacja funkcji `fetchTopics()` z obsługą błędów
5. Implementacja funkcji `handleSubmit()` - wywołanie API generate
6. Implementacja funkcji `handleAccept()`, `handleReject()`, `handleEdit()`
7. Implementacja funkcji `clearError()` i `retryGeneration()`
8. Dodanie `useEffect` dla inicjalizacji (fetch topics)

### Krok 3: Implementacja komponentów formularza (bottom-up)
1. **AgeGroupSelect:**
   - Utworzenie `src/components/AgeGroupSelect.tsx`
   - Wykorzystanie Shadcn Select
   - Zmapowanie stałej AGE_GROUPS na SelectItem
   - Obsługa onChange
2. **TopicSelect:**
   - Utworzenie `src/components/TopicSelect.tsx`
   - Wykorzystanie Shadcn Select
   - Renderowanie listy tematów z props
   - Obsługa pustej listy (disabled state)
3. **QuestionCountInput:**
   - Utworzenie `src/components/QuestionCountInput.tsx`
   - Wykorzystanie Shadcn Slider lub Input
   - Walidacja zakresu 1-10
   - Wyświetlanie aktualnej wartości
4. **GenerateButton:**
   - Utworzenie `src/components/GenerateButton.tsx`
   - Wykorzystanie Shadcn Button
   - Obsługa loading state (spinner wewnątrz)
   - Disabled state
5. **QuestionGeneratorForm:**
   - Utworzenie `src/components/QuestionGeneratorForm.tsx`
   - Złożenie wszystkich powyższych komponentów
   - Obsługa submit formularza
   - Walidacja formularza (isFormValid)
   - Przekazanie props z hooka

### Krok 4: Implementacja komponentów dla pytań
1. **QuestionCard:**
   - Utworzenie `src/components/QuestionCard.tsx`
   - Wykorzystanie Shadcn Card
   - Implementacja dwóch trybów: view i edit
   - Lokalny stan dla mode i editedContent
   - Warunkowe renderowanie (view mode vs edit mode)
   - Obsługa akcji Accept/Reject/Edit
2. **AcceptButton, RejectButton, EditButton:**
   - Utworzenie komponentów przycisków (mogą być inline w QuestionCard)
   - Wykorzystanie Shadcn Button z odpowiednimi wariantami
   - Ikony z biblioteki (np. lucide-react)
3. **GeneratedQuestionsList:**
   - Utworzenie `src/components/GeneratedQuestionsList.tsx`
   - Renderowanie tablicy QuestionCard
   - Obsługa empty state
   - Nagłówek z liczbą pytań

### Krok 5: Implementacja komponentów pomocniczych
1. **LoadingSpinner:**
   - Utworzenie `src/components/LoadingSpinner.tsx`
   - Animowany spinner (z Shadcn lub custom CSS)
   - Opcjonalny komunikat tekstowy
2. **ErrorAlert:**
   - Utworzenie `src/components/ErrorAlert.tsx`
   - Wykorzystanie Shadcn Toast lub Alert
   - Przycisk "Spróbuj ponownie"
   - Przycisk zamknięcia
   - Auto-dismiss (opcjonalnie)

### Krok 6: Implementacja głównego komponentu widoku
1. **GenerateQuestionsView:**
   - Utworzenie `src/components/GenerateQuestionsView.tsx`
   - Użycie hooka `useGenerateQuestions`
   - Warunkowe renderowanie:
     - Loading topics → LoadingSpinner
     - No topics → Empty state z linkiem do /topics
     - Error → ErrorAlert
     - Success → QuestionGeneratorForm
   - Warunkowe renderowanie:
     - Generating → LoadingSpinner podczas generowania
     - Generated questions → GeneratedQuestionsList
   - Przekazanie callbacków do komponentów dzieci

### Krok 7: Implementacja strony Astro
1. **generate.astro:**
   - Utworzenie struktury strony z Layout
   - Import `GenerateQuestionsView` jako client component
   - Dodanie dyrektywy `client:load` dla React component
   - Stylowanie kontenera (Tailwind)
   - Meta tags i tytuł strony: "Generuj pytania | EduKids"

### Krok 8: Stylowanie i responsywność
1. Dodanie klas Tailwind dla layoutu widoku
2. Responsywność formularza (mobile-first)
3. Responsywność listy pytań (grid/stack)
4. Animacje i transitions:
   - Fade-in dla pytań
   - Slide-out dla odrzuconych pytań
   - Loading states
5. Accessibility:
   - ARIA labels
   - Focus management
   - Keyboard navigation

### Krok 9: Testowanie i debugowanie
1. Test przepływu happy path:
   - Pobranie tematów
   - Wypełnienie formularza
   - Generowanie pytań
   - Akceptacja/odrzucenie/edycja
2. Test błędów:
   - Brak tematów
   - Błąd sieci podczas pobierania tematów
   - Błąd podczas generowania pytań
   - Timeout
3. Test walidacji:
   - Próba submit pustego formularza
   - Wartości poza zakresem
   - Brak wybranego tematu
4. Test responsywności na różnych urządzeniach
5. Test accessibility (klawiatura, screen reader)

### Krok 10: Integracja z API (do wykonania gdy endpoint PATCH będzie gotowy)
1. Utworzenie endpoint PATCH /api/questions/:id
2. Aktualizacja funkcji `handleAccept()` w hooku - wywołanie API
3. Aktualizacja funkcji `handleEdit()` w hooku - wywołanie API
4. Obsługa odpowiedzi i błędów
5. Testowanie pełnego przepływu accept/edit z prawdziwym API

### Krok 11: Optymalizacje i poprawki
1. Dodanie debouncing dla przycisku Generate
2. Optymalizacja re-renderów (React.memo, useMemo)
3. Dodanie loading skeletons zamiast spinnerów
4. Poprawki UX na podstawie testów
5. Code review i refactoring

### Krok 12: Dokumentacja
1. Dodanie komentarzy JSDoc do wszystkich komponentów
2. Aktualizacja README z opisem widoku
3. Screenshoty/diagramy przepływów (opcjonalnie)
4. Dokumentacja dla przyszłego developera

