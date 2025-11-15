# Plan implementacji widoku Moje tematy

## 1. Przegląd

Widok "Moje tematy" umożliwia użytkownikom pełne zarządzanie swoimi tematami (CRUD - Create, Read, Update, Delete). Użytkownik może przeglądać listę swoich tematów, dodawać nowe tematy, edytować istniejące (inline lub w modalu) oraz usuwać tematy z potwierdzeniem. Ten widok jest fundamentalny dla funkcjonalności aplikacji, ponieważ tematy są wymagane do generowania pytań.

Widok zapewnia intuicyjny interfejs z obsługą stanów ładowania, komunikatami walidacyjnymi oraz potwierdzeniami dla operacji destrukcyjnych (usuwanie). Implementacja zgodna z wymaganiami PRD i user story US-008.

## 2. Routing widoku

- **Ścieżka:** `/topics`
- **Typ:** Strona kliencka (client-side page)
- **Framework:** Astro z komponentami React dla interaktywnych części

## 3. Struktura komponentów

```
TopicsPage (Astro)
└── TopicsView (React)
    ├── PageHeader (React)
    │   ├── Title
    │   └── AddTopicButton (Shadcn Button)
    ├── LoadingSpinner (React/Shadcn)
    ├── EmptyState (React)
    │   └── AddFirstTopicButton (Shadcn Button)
    ├── TopicsList (React)
    │   └── TopicItem[] (React)
    │       ├── TopicDisplay (React)
    │       │   ├── TopicName
    │       │   └── TopicMetadata (created_at)
    │       └── TopicActions (React)
    │           ├── EditButton (Shadcn Button)
    │           └── DeleteButton (Shadcn Button)
    ├── AddTopicDialog (Shadcn Dialog)
    │   └── TopicForm (React)
    │       ├── NameInput (Shadcn Input)
    │       ├── CancelButton (Shadcn Button)
    │       └── SubmitButton (Shadcn Button)
    ├── EditTopicDialog (Shadcn Dialog)
    │   └── TopicForm (React)
    └── DeleteConfirmationDialog (Shadcn AlertDialog)
        ├── ConfirmButton (Shadcn Button)
        └── CancelButton (Shadcn Button)
```

## 4. Szczegóły komponentów

### 4.1 TopicsPage (Astro)

**Opis:** Główny plik strony Astro, który renderuje layout i osadza główny komponent React odpowiedzialny za logikę widoku.

**Główne elementy:**
- Layout z nagłówkiem strony
- Kontener dla komponentu React `TopicsView`
- Meta tags i tytuł strony

**Obsługiwane interakcje:** Brak (tylko kontener)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak (plik strony)

---

### 4.2 TopicsView (React)

**Opis:** Główny komponent React zarządzający całym stanem widoku tematów. Odpowiada za komunikację z API, zarządzanie stanem listy tematów, obsługę operacji CRUD oraz wyświetlanie dialogów.

**Główne elementy:**
- Kontener główny (`<div>` z odpowiednimi klasami Tailwind)
- `PageHeader` - nagłówek z przyciskiem dodawania
- `LoadingSpinner` - wyświetlany podczas ładowania listy
- `EmptyState` - wyświetlany gdy użytkownik nie ma tematów
- `TopicsList` - lista tematów
- `AddTopicDialog` - modal dodawania nowego tematu
- `EditTopicDialog` - modal edycji tematu
- `DeleteConfirmationDialog` - dialog potwierdzenia usunięcia

**Obsługiwane interakcje:**
- Inicjalizacja: pobieranie listy tematów użytkownika
- Otwieranie/zamykanie dialogów
- Dodawanie nowego tematu
- Edycja istniejącego tematu
- Usuwanie tematu z potwierdzeniem
- Obsługa błędów

**Obsługiwana walidacja:**
- Walidacja odpowiedzi API
- Obsługa błędów sieci

**Typy:**
- `TopicDto` (z types.ts)
- `CreateTopicCommand` (z types.ts)
- `UpdateTopicCommand` (z types.ts)
- `TopicsViewState` (ViewModel)
- `DialogState` (ViewModel)

**Propsy:** Brak (top-level component)

---

### 4.3 PageHeader (React)

**Opis:** Nagłówek widoku zawierający tytuł strony oraz przycisk do dodawania nowego tematu.

**Główne elementy:**
- Kontener header (`<header>` z flexbox layout)
- `<h1>` z tytułem "Moje tematy"
- `AddTopicButton` - przycisk "Dodaj temat"

**Obsługiwane interakcje:**
- Click na AddTopicButton → otwiera AddTopicDialog

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface PageHeaderProps {
  onAddClick: () => void;
}
```

---

### 4.4 AddTopicButton (Shadcn Button)

**Opis:** Przycisk inicjujący proces dodawania nowego tematu. Otwiera modal z formularzem.

**Główne elementy:**
- Shadcn `Button` component (variant="default")
- Ikona plus/add
- Tekst "Dodaj temat"

**Obsługiwane interakcje:**
- Click → wywołanie onAddClick callback

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface AddTopicButtonProps {
  onClick: () => void;
}
```

---

### 4.5 LoadingSpinner (React/Shadcn)

**Opis:** Komponent wyświetlający animowany spinner podczas ładowania listy tematów.

**Główne elementy:**
- Kontener z animowaną ikoną spinner
- Opcjonalny tekst "Ładowanie tematów..."

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

### 4.6 EmptyState (React)

**Opis:** Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych tematów. Zachęca do utworzenia pierwszego tematu.

**Główne elementy:**
- Kontener z ikoną (np. folder-open)
- Nagłówek: "Nie masz jeszcze żadnych tematów"
- Opis: "Tematy pomagają organizować pytania. Utwórz pierwszy temat, aby rozpocząć."
- `AddFirstTopicButton` - przycisk CTA "Utwórz pierwszy temat"

**Obsługiwane interakcje:**
- Click na AddFirstTopicButton → otwiera AddTopicDialog

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyStateProps {
  onAddClick: () => void;
}
```

---

### 4.7 TopicsList (React)

**Opis:** Komponent wyświetlający listę tematów użytkownika. Każdy temat jest renderowany w osobnym komponencie `TopicItem`.

**Główne elementy:**
- Kontener listy (`<ul>` lub `<div>`)
- Opcjonalny nagłówek z liczbą tematów: "Twoje tematy (5)"
- Array `TopicItem` components

**Obsługiwane interakcje:**
- Renderowanie listy tematów
- Przekazywanie akcji do pozycji listy

**Obsługiwana walidacja:**
- Sprawdzenie czy lista nie jest pusta

**Typy:**
- `TopicDto[]` (lista tematów)

**Propsy:**
```typescript
interface TopicsListProps {
  topics: TopicDto[];
  onEdit: (topic: TopicDto) => void;
  onDelete: (topic: TopicDto) => void;
}
```

---

### 4.8 TopicItem (React)

**Opis:** Komponent pojedynczej pozycji na liście tematów. Wyświetla informacje o temacie oraz przyciski akcji (edytuj, usuń).

**Główne elementy:**
- Kontener (`<li>` lub Shadcn Card)
- `TopicDisplay` - lewa strona z nazwą i metadanymi
- `TopicActions` - prawa strona z przyciskami akcji

**Obsługiwane interakcje:**
- Hover: podświetlenie pozycji
- Click Edit → wywołanie onEdit callback
- Click Delete → wywołanie onDelete callback

**Obsługiwana walidacja:** Brak

**Typy:**
- `TopicDto` (pojedynczy temat)

**Propsy:**
```typescript
interface TopicItemProps {
  topic: TopicDto;
  onEdit: (topic: TopicDto) => void;
  onDelete: (topic: TopicDto) => void;
}
```

---

### 4.9 TopicDisplay (React)

**Opis:** Komponent wyświetlający informacje o temacie (nazwa, data utworzenia).

**Główne elementy:**
- `TopicName` - nazwa tematu (`<h3>` lub `<div>`)
- `TopicMetadata` - data utworzenia w formacie czytelnym (np. "Utworzono 2 dni temu")

**Obsługiwane interakcje:** Brak (tylko wyświetlanie)

**Obsługiwana walidacja:** Brak

**Typy:**
- `TopicDto`

**Propsy:**
```typescript
interface TopicDisplayProps {
  topic: TopicDto;
}
```

---

### 4.10 TopicActions (React)

**Opis:** Komponent zawierający przyciski akcji dla pojedynczego tematu (edytuj, usuń).

**Główne elementy:**
- Kontener dla przycisków (flexbox)
- `EditButton` - przycisk edycji
- `DeleteButton` - przycisk usunięcia

**Obsługiwane interakcje:**
- Click Edit → wywołanie onEdit
- Click Delete → wywołanie onDelete

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface TopicActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}
```

---

### 4.11 EditButton (Shadcn Button)

**Opis:** Przycisk uruchamiający edycję tematu.

**Główne elementy:**
- Shadcn `Button` (variant="ghost" lub "outline")
- Ikona pencil/edit
- Opcjonalny tekst "Edytuj" (może być tylko ikona)

**Obsługiwane interakcje:**
- Click → wywołanie onClick callback

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 4.12 DeleteButton (Shadcn Button)

**Opis:** Przycisk uruchamiający proces usuwania tematu (z potwierdzeniem).

**Główne elementy:**
- Shadcn `Button` (variant="ghost" lub "destructive")
- Ikona trash/delete
- Opcjonalny tekst "Usuń" (może być tylko ikona)

**Obsługiwane interakcje:**
- Click → wywołanie onClick callback (otwiera dialog potwierdzenia)

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 4.13 AddTopicDialog (Shadcn Dialog)

**Opis:** Modal zawierający formularz dodawania nowego tematu. Wykorzystuje komponent Dialog z Shadcn/ui.

**Główne elementy:**
- Shadcn `Dialog` component
- `DialogTrigger` - hidden (sterowane programowo)
- `DialogContent` - zawartość modala
  - `DialogHeader` z tytułem "Dodaj nowy temat"
  - `TopicForm` - formularz
  - `DialogFooter` z przyciskami

**Obsługiwane interakcje:**
- Otwieranie/zamykanie modala
- Submit formularza → wywołanie API POST /api/topics
- Close (X) lub Cancel → zamknięcie bez zapisu

**Obsługiwana walidacja:**
- Przekazana do komponentu TopicForm

**Typy:**
- `CreateTopicCommand`
- `TopicDto` (zwracany po utworzeniu)

**Propsy:**
```typescript
interface AddTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTopicCommand) => Promise<void>;
  isSubmitting: boolean;
}
```

---

### 4.14 EditTopicDialog (Shadcn Dialog)

**Opis:** Modal zawierający formularz edycji istniejącego tematu. Podobny do AddTopicDialog, ale z predefiniowanymi wartościami.

**Główne elementy:**
- Shadcn `Dialog` component
- `DialogContent` - zawartość modala
  - `DialogHeader` z tytułem "Edytuj temat"
  - `TopicForm` - formularz z wartościami początkowymi
  - `DialogFooter` z przyciskami

**Obsługiwane interakcje:**
- Otwieranie/zamykanie modala
- Submit formularza → wywołanie API PUT /api/topics/:id
- Close (X) lub Cancel → zamknięcie bez zapisu

**Obsługiwana walidacja:**
- Przekazana do komponentu TopicForm

**Typy:**
- `TopicDto` (edytowany temat)
- `UpdateTopicCommand`

**Propsy:**
```typescript
interface EditTopicDialogProps {
  isOpen: boolean;
  topic: TopicDto | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateTopicCommand) => Promise<void>;
  isSubmitting: boolean;
}
```

---

### 4.15 TopicForm (React)

**Opis:** Reużywalny komponent formularza dla dodawania i edycji tematu. Zawiera pole nazwy tematu oraz przyciski akcji.

**Główne elementy:**
- `<form>` element z obsługą submit
- `NameInput` - pole tekstowe dla nazwy tematu
- `CancelButton` - anulowanie operacji
- `SubmitButton` - zatwierdzenie formularza

**Obsługiwane interakcje:**
- Zmiana wartości w polu nazwy
- Submit formularza
- Cancel → wywołanie onCancel

**Obsługiwana walidacja:**
- Nazwa tematu: wymagana, 1-100 znaków
- Trim whitespace
- Komunikaty walidacyjne pod inputem

**Typy:**
- `TopicFormData` (ViewModel)
- `CreateTopicCommand` lub `UpdateTopicCommand`

**Propsy:**
```typescript
interface TopicFormProps {
  initialValue?: string; // dla trybu edycji
  onSubmit: (data: { name: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel?: string; // "Dodaj" lub "Zapisz"
}
```

---

### 4.16 NameInput (Shadcn Input)

**Opis:** Pole tekstowe do wprowadzania nazwy tematu z walidacją.

**Główne elementy:**
- Shadcn `Input` component
- `Label` - "Nazwa tematu"
- Komunikat walidacyjny (error message)
- Character counter: "X / 100 znaków"

**Obsługiwane interakcje:**
- Wpisywanie tekstu
- Walidacja w czasie rzeczywistym
- Wyświetlanie błędów

**Obsługiwana walidacja:**
- Minimum 1 znak
- Maximum 100 znaków
- Trim whitespace przed walidacją

**Typy:**
- `string` (wartość pola)

**Propsy:**
```typescript
interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}
```

---

### 4.17 DeleteConfirmationDialog (Shadcn AlertDialog)

**Opis:** Dialog potwierdzenia usunięcia tematu. Wyświetla ostrzeżenie i wymaga potwierdzenia operacji destrukcyjnej.

**Główne elementy:**
- Shadcn `AlertDialog` component
- `AlertDialogContent`
  - `AlertDialogHeader`
    - `AlertDialogTitle`: "Czy na pewno chcesz usunąć ten temat?"
    - `AlertDialogDescription`: "Ta operacja jest nieodwracalna. Wszystkie pytania związane z tym tematem również zostaną usunięte."
  - `AlertDialogFooter`
    - `CancelButton`: "Anuluj"
    - `ConfirmButton`: "Usuń temat" (destructive variant)

**Obsługiwane interakcje:**
- Confirm → wywołanie onConfirm (API DELETE)
- Cancel → zamknięcie dialogu bez akcji

**Obsługiwana walidacja:** Brak

**Typy:**
- `TopicDto` (temat do usunięcia)

**Propsy:**
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  topic: TopicDto | null;
  onConfirm: (topicId: number) => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}
```

---

### 4.18 ConfirmButton (Shadcn Button)

**Opis:** Przycisk potwierdzający usunięcie tematu w dialugu.

**Główne elementy:**
- Shadcn `Button` (variant="destructive")
- Tekst "Usuń temat"
- Loading state (spinner) podczas usuwania

**Obsługiwane interakcje:**
- Click → wywołanie onConfirm

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface ConfirmButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}
```

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

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

**CreateTopicCommand** - dane do utworzenia nowego tematu
```typescript
interface CreateTopicCommand {
  name: string;
}
```

**UpdateTopicCommand** - dane do aktualizacji tematu
```typescript
interface UpdateTopicCommand {
  name: string;
}
```

**ValidationRules** - reguły walidacji (istniejące)
```typescript
const ValidationRules = {
  topic: {
    nameMinLength: 1,
    nameMaxLength: 100,
  },
  // ...
};
```

### 5.2 Nowe typy ViewModel (do utworzenia)

**TopicsViewState** - główny stan widoku tematów
```typescript
interface TopicsViewState {
  topics: TopicDto[];
  isLoading: boolean;
  error: ErrorMessage | null;
  dialogState: DialogState;
}
```
Pola:
- `topics`: lista tematów użytkownika
- `isLoading`: czy trwa ładowanie listy tematów
- `error`: aktualny błąd (jeśli wystąpił)
- `dialogState`: stan dialogów (który jest otwarty, z jakimi danymi)

**DialogState** - stan dialogów w widoku
```typescript
interface DialogState {
  addDialog: {
    isOpen: boolean;
    isSubmitting: boolean;
  };
  editDialog: {
    isOpen: boolean;
    topic: TopicDto | null;
    isSubmitting: boolean;
  };
  deleteDialog: {
    isOpen: boolean;
    topic: TopicDto | null;
    isDeleting: boolean;
  };
}
```
Pola:
- `addDialog`: stan dialogu dodawania nowego tematu
  - `isOpen`: czy dialog jest otwarty
  - `isSubmitting`: czy trwa wysyłanie formularza
- `editDialog`: stan dialogu edycji tematu
  - `isOpen`: czy dialog jest otwarty
  - `topic`: edytowany temat (null gdy zamknięty)
  - `isSubmitting`: czy trwa wysyłanie formularza
- `deleteDialog`: stan dialogu potwierdzenia usunięcia
  - `isOpen`: czy dialog jest otwarty
  - `topic`: temat do usunięcia (null gdy zamknięty)
  - `isDeleting`: czy trwa proces usuwania

**TopicFormData** - stan formularza tematu (add/edit)
```typescript
interface TopicFormData {
  name: string;
}
```
Pola:
- `name`: nazwa tematu (walidowana 1-100 znaków)

**ErrorMessage** - reprezentacja błędu
```typescript
interface ErrorMessage {
  type: "network" | "validation" | "server" | "not_found";
  message: string;
  details?: string[];
}
```
Pola:
- `type`: typ błędu
- `message`: główny komunikat dla użytkownika
- `details`: opcjonalne szczegóły (np. błędy walidacji)

**TopicFormValidation** - stan walidacji formularza
```typescript
interface TopicFormValidation {
  name: {
    isValid: boolean;
    error?: string;
  };
}
```
Pola:
- `name`: stan walidacji pola nazwy
  - `isValid`: czy pole jest poprawne
  - `error`: komunikat błędu (jeśli niepoprawne)

## 6. Zarządzanie stanem

### 6.1 Stan główny widoku

Stan widoku jest zarządzany w komponencie `TopicsView` przy użyciu React hooks. Ze względu na złożoność logiki (operacje CRUD + 3 dialogi), zalecane jest utworzenie custom hooka `useTopics`.

### 6.2 Custom Hook: useTopics

**Lokalizacja:** `src/lib/hooks/useTopics.ts`

**Odpowiedzialności:**
- Zarządzanie stanem listy tematów
- Pobieranie listy tematów przy montowaniu komponentu
- Operacje CRUD: Create, Update, Delete
- Zarządzanie stanem dialogów (otwieranie/zamykanie)
- Obsługa błędów
- Optymistyczna aktualizacja UI

**Zwracane wartości:**
```typescript
interface UseTopicsReturn {
  // Stan
  topics: TopicDto[];
  isLoading: boolean;
  error: ErrorMessage | null;
  
  // Stan dialogów
  addDialog: DialogState['addDialog'];
  editDialog: DialogState['editDialog'];
  deleteDialog: DialogState['deleteDialog'];
  
  // Akcje dialogów
  openAddDialog: () => void;
  closeAddDialog: () => void;
  openEditDialog: (topic: TopicDto) => void;
  closeEditDialog: () => void;
  openDeleteDialog: (topic: TopicDto) => void;
  closeDeleteDialog: () => void;
  
  // Akcje CRUD
  createTopic: (data: CreateTopicCommand) => Promise<void>;
  updateTopic: (id: number, data: UpdateTopicCommand) => Promise<void>;
  deleteTopic: (id: number) => Promise<void>;
  
  // Pomocnicze
  refreshTopics: () => Promise<void>;
  clearError: () => void;
}
```

**Implementacja (szkic):**
```typescript
export function useTopics() {
  const [state, setState] = useState<TopicsViewState>({
    topics: [],
    isLoading: false,
    error: null,
    dialogState: {
      addDialog: { isOpen: false, isSubmitting: false },
      editDialog: { isOpen: false, topic: null, isSubmitting: false },
      deleteDialog: { isOpen: false, topic: null, isDeleting: false },
    },
  });

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        topics: data.data || [], 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: {
          type: 'network',
          message: 'Nie udało się pobrać listy tematów',
        }
      }));
    }
  };

  const createTopic = async (data: CreateTopicCommand) => {
    // Set submitting state
    setState(prev => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        addDialog: { ...prev.dialogState.addDialog, isSubmitting: true },
      },
    }));

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create topic');
      }

      const newTopic = await response.json();
      
      // Optymistyczna aktualizacja + zamknięcie dialogu
      setState(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic],
        dialogState: {
          ...prev.dialogState,
          addDialog: { isOpen: false, isSubmitting: false },
        },
      }));

      // Toast sukcesu
      // toast.success('Temat został utworzony');
    } catch (error) {
      // Obsługa błędu
      setState(prev => ({
        ...prev,
        dialogState: {
          ...prev.dialogState,
          addDialog: { ...prev.dialogState.addDialog, isSubmitting: false },
        },
        error: {
          type: 'server',
          message: error.message,
        },
      }));
    }
  };

  const updateTopic = async (id: number, data: UpdateTopicCommand) => {
    // Similar implementation...
  };

  const deleteTopic = async (id: number) => {
    // Similar implementation...
  };

  // Dialog management functions
  const openAddDialog = () => {
    setState(prev => ({
      ...prev,
      dialogState: {
        ...prev.dialogState,
        addDialog: { isOpen: true, isSubmitting: false },
      },
    }));
  };

  // ... other dialog functions

  return {
    topics: state.topics,
    isLoading: state.isLoading,
    error: state.error,
    addDialog: state.dialogState.addDialog,
    editDialog: state.dialogState.editDialog,
    deleteDialog: state.dialogState.deleteDialog,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    openDeleteDialog,
    closeDeleteDialog,
    createTopic,
    updateTopic,
    deleteTopic,
    refreshTopics: fetchTopics,
    clearError,
  };
}
```

### 6.3 Stan lokalny w TopicForm

Formularz zarządza własnym lokalnym stanem dla:
- `formData`: { name: string }
- `validation`: TopicFormValidation
- Walidacja w czasie rzeczywistym (onChange)

## 7. Integracja API

### 7.1 Endpoint: GET /api/topics

**Uwaga:** Ten endpoint nie jest jeszcze zaimplementowany, ale będzie potrzebny do pobrania listy tematów.

**Cel:** Pobranie listy wszystkich tematów użytkownika

**Request:**
- Metoda: GET
- Headers: Content-Type: application/json
- Body: Brak
- Query params (przyszłość):
  - `page`: number (pagination)
  - `limit`: number (pagination)
  - `sort_by`: "name" | "created_at"
  - `order`: "asc" | "desc"

**Response Success (200):**
```typescript
{
  data: TopicDto[];
  pagination?: PaginationDto; // w przyszłości
}
```
Przykład:
```json
{
  "data": [
    {
      "id": 1,
      "user_id": "uuid-123",
      "name": "Matematyka",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "user_id": "uuid-123",
      "name": "Przyroda",
      "created_at": "2025-01-16T14:20:00Z",
      "updated_at": "2025-01-16T14:20:00Z"
    }
  ]
}
```

**Response Error:**
- 401: Unauthorized (użytkownik niezalogowany)
- 500: Server error

**Obsługa błędów:**
- Network error: toast z retry
- 401: przekierowanie do logowania
- 500: toast z informacją o problemie

**Moment wywołania:** Przy montowaniu komponentu `TopicsView` (useEffect)

### 7.2 Endpoint: POST /api/topics

**Cel:** Utworzenie nowego tematu dla użytkownika

**Request:**
- Metoda: POST
- Headers: Content-Type: application/json
- Body: `CreateTopicCommand`
```typescript
{
  name: string; // 1-100 znaków, trim
}
```
Przykład:
```json
{
  "name": "Historia"
}
```

**Response Success (201):**
```typescript
TopicDto
```
Przykład:
```json
{
  "id": 3,
  "user_id": "uuid-123",
  "name": "Historia",
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-20T09:00:00Z"
}
```

**Response Error:**
- 400: Validation error
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
- 401: Unauthorized
- 500: Server error
  ```json
  {
    "error": "Internal server error",
    "message": "Failed to create topic"
  }
  ```

**Obsługa błędów:**
- 400: wyświetlenie szczegółów walidacji pod inputem w formularzu
- 401: przekierowanie do logowania
- 500: toast z komunikatem błędu, dialog pozostaje otwarty
- Network error: toast z retry, dialog pozostaje otwarty

**Moment wywołania:** Po submicie formularza w AddTopicDialog

### 7.3 Endpoint: PUT /api/topics/:id

**Uwaga:** Ten endpoint nie jest jeszcze zaimplementowany.

**Cel:** Aktualizacja istniejącego tematu

**Request:**
- Metoda: PUT
- Headers: Content-Type: application/json
- URL params: `id` (number) - ID tematu
- Body: `UpdateTopicCommand`
```typescript
{
  name: string; // 1-100 znaków, trim
}
```
Przykład:
```json
{
  "name": "Historia Starożytna"
}
```

**Response Success (200):**
```typescript
TopicDto
```
Przykład:
```json
{
  "id": 3,
  "user_id": "uuid-123",
  "name": "Historia Starożytna",
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-20T11:30:00Z"
}
```

**Response Error:**
- 400: Validation error (jak w POST)
- 401: Unauthorized
- 404: Topic not found or doesn't belong to user
  ```json
  {
    "error": "Not Found",
    "message": "Topic not found or doesn't belong to user"
  }
  ```
- 500: Server error

**Obsługa błędów:**
- 400: wyświetlenie błędów walidacji w formularzu
- 404: toast "Temat nie został znaleziony", zamknięcie dialogu, odświeżenie listy
- 500: toast z błędem, dialog pozostaje otwarty
- Network error: toast z retry, dialog pozostaje otwarty

**Moment wywołania:** Po submicie formularza w EditTopicDialog

### 7.4 Endpoint: DELETE /api/topics/:id

**Uwaga:** Ten endpoint nie jest jeszcze zaimplementowany.

**Cel:** Usunięcie tematu

**Request:**
- Metoda: DELETE
- Headers: Content-Type: application/json
- URL params: `id` (number) - ID tematu
- Body: Brak

**Response Success (200 lub 204):**
```typescript
{
  success: true
}
```
lub status 204 No Content (bez body)

**Response Error:**
- 401: Unauthorized
- 404: Topic not found or doesn't belong to user
- 409: Conflict (może być użyty gdy temat ma powiązane pytania - do ustalenia)
  ```json
  {
    "error": "Conflict",
    "message": "Cannot delete topic with existing questions"
  }
  ```
- 500: Server error

**Obsługa błędów:**
- 404: toast "Temat nie został znaleziony", zamknięcie dialogu, odświeżenie listy
- 409: toast "Nie można usunąć tematu z pytaniami" (jeśli zaimplementowano constraint)
- 500: toast z błędem, dialog pozostaje otwarty
- Network error: toast z retry, dialog pozostaje otwarty

**Moment wywołania:** Po potwierdzeniu w DeleteConfirmationDialog

### 7.5 Strategia aktualizacji UI

**Optymistyczna aktualizacja:**
- Po sukcesie operacji POST/PUT/DELETE, aktualizacja lokalnej listy tematów bez ponownego fetchowania
- Szybszy feedback dla użytkownika
- Fallback: w razie błędu, możliwość odświeżenia listy

**Pesymistyczna aktualizacja (alternatywa):**
- Po sukcesie operacji, wywołanie `refreshTopics()` aby pobrać aktualną listę z serwera
- Wolniejsze, ale gwarantuje spójność

**Rekomendacja:** Optymistyczna aktualizacja + możliwość manualnego odświeżenia

## 8. Interakcje użytkownika

### 8.1 Inicjalizacja widoku

**Akcja użytkownika:** Wejście na stronę `/topics`

**Przepływ:**
1. Komponent `TopicsView` montuje się
2. Hook `useTopics` wywołuje fetchTopics()
3. Wyświetlany jest LoadingSpinner
4. Po załadowaniu:
   - Jeśli lista pusta: wyświetl EmptyState
   - Jeśli lista niepusta: wyświetl PageHeader + TopicsList
5. Jeśli błąd: wyświetl komunikat błędu z retry

**Stan UI:**
- Loading: Spinner + "Ładowanie tematów..."
- Success (pusta lista): EmptyState z przyciskiem "Utwórz pierwszy temat"
- Success (niepusta lista): Header + lista tematów
- Error: Alert z komunikatem błędu + przycisk retry

### 8.2 Dodawanie nowego tematu

**Akcja użytkownika:** Kliknięcie przycisku "Dodaj temat" (w PageHeader lub EmptyState)

**Przepływ:**
1. Wywołanie `openAddDialog()`
2. Otwarcie modala AddTopicDialog
3. Użytkownik wpisuje nazwę tematu
4. Walidacja w czasie rzeczywistym (1-100 znaków)
5. Użytkownik klika "Dodaj":
   - Jeśli formularz niepoprawny: wyświetl błędy, zatrzymaj
   - Jeśli poprawny: wywołaj `createTopic(data)`
6. Wyświetlenie loading state w przycisku
7. Po sukcesie:
   - Zamknięcie dialogu
   - Nowy temat pojawia się na liście
   - Toast: "Temat został utworzony"
8. Po błędzie:
   - Dialog pozostaje otwarty
   - Toast z komunikatem błędu
   - Możliwość poprawy i ponowienia

**Stan UI:**
- Modal otwarty:
  - Input z focusem
  - Przyciski: "Anuluj", "Dodaj"
- Submitting:
  - Input disabled
  - Przycisk "Dodaj" z spinnerem
  - Przycisk "Anuluj" disabled
- Success:
  - Modal zamyka się z animacją
  - Nowy temat fade-in na liście
  - Toast sukcesu
- Error:
  - Modal pozostaje otwarty
  - Błędy walidacji pod inputem (jeśli 400)
  - Toast z błędem (jeśli 500)

**Interakcja Cancel:**
- Click "Anuluj" lub X → zamknięcie dialogu bez zapisu
- Wyczyszczenie formularza

### 8.3 Edycja tematu

**Akcja użytkownika:** Kliknięcie przycisku "Edytuj" przy temacie

**Przepływ:**
1. Wywołanie `openEditDialog(topic)`
2. Otwarcie modala EditTopicDialog
3. Formularz załadowany z aktualną nazwą tematu
4. Użytkownik modyfikuje nazwę
5. Walidacja w czasie rzeczywistym
6. Użytkownik klika "Zapisz":
   - Jeśli formularz niepoprawny: wyświetl błędy, zatrzymaj
   - Jeśli poprawny: wywołaj `updateTopic(id, data)`
7. Wyświetlenie loading state
8. Po sukcesie:
   - Zamknięcie dialogu
   - Zaktualizowana nazwa na liście
   - Toast: "Temat został zaktualizowany"
9. Po błędzie:
   - 404: zamknij dialog, toast "Temat nie został znaleziony", odśwież listę
   - Inny błąd: dialog otwarty, toast z błędem

**Stan UI:**
- Modal otwarty:
  - Input z aktualną nazwą i focusem na końcu tekstu
  - Przyciski: "Anuluj", "Zapisz"
- Submitting:
  - Input disabled
  - Przycisk "Zapisz" z spinnerem
- Success:
  - Modal zamyka się
  - Nazwa tematu na liście aktualizuje się
  - Toast sukcesu
- Error (404):
  - Modal zamyka się
  - Toast: "Temat nie został znaleziony"
  - Lista odświeża się
- Error (inne):
  - Modal pozostaje otwarty
  - Toast z błędem

### 8.4 Usuwanie tematu

**Akcja użytkownika:** Kliknięcie przycisku "Usuń" przy temacie

**Przepływ:**
1. Wywołanie `openDeleteDialog(topic)`
2. Otwarcie AlertDialog z potwierdzeniem
3. Wyświetlenie komunikatu:
   - "Czy na pewno chcesz usunąć temat '[Nazwa]'?"
   - "Ta operacja jest nieodwracalna."
4. Użytkownik może:
   - Kliknąć "Anuluj" → zamknięcie dialogu, brak akcji
   - Kliknąć "Usuń temat" → wywołanie `deleteTopic(id)`
5. Po kliknięciu "Usuń":
   - Loading state w przycisku
   - Disable przycisku "Anuluj"
6. Po sukcesie:
   - Zamknięcie dialogu
   - Temat znika z listy (fade-out animacja)
   - Toast: "Temat został usunięty"
   - Jeśli lista stała się pusta: wyświetl EmptyState
7. Po błędzie:
   - Dialog zamyka się
   - Toast z komunikatem błędu
   - Lista pozostaje bez zmian

**Stan UI:**
- Dialog otwarty:
  - Komunikat ostrzeżenia
  - Nazwa tematu w cudzysłowie
  - Przyciski: "Anuluj" (default), "Usuń temat" (destructive)
- Deleting:
  - Przycisk "Usuń" z spinnerem
  - Przycisk "Anuluj" disabled
- Success:
  - Dialog zamyka się
  - Temat fade-out z listy
  - Toast sukcesu
- Error:
  - Dialog zamyka się
  - Toast z błędem
  - Lista bez zmian

### 8.5 Retry po błędzie

**Akcja użytkownika:** Kliknięcie "Spróbuj ponownie" w komunikacie błędu

**Przepływ:**
1. W zależności od kontekstu:
   - Błąd ładowania listy → wywołanie `refreshTopics()`
   - Błąd operacji CRUD → user musi powtórzyć akcję ręcznie (np. ponownie kliknąć "Dodaj" w formularzu)
2. Wyświetlenie loading state
3. Obsługa jak przy standardowej operacji

### 8.6 Responsywność i UX

**Desktop:**
- Lista tematów w formie kart/wierszy z ikonami akcji po prawej
- Hover effects na pozycjach listy
- Tooltips na przyciskach akcji

**Mobile:**
- Lista stackowana pionowo
- Przyciski akcji większe (touch-friendly)
- Modal pełnoekranowy lub prawie pełnoekranowy

**Animacje:**
- Fade-in dla nowych tematów
- Fade-out dla usuniętych tematów
- Smooth open/close dialogów
- Skeleton loader zamiast spinnera (opcjonalnie)

## 9. Warunki i walidacja

### 9.1 Walidacja formularza tematu

**Komponent:** `TopicForm`

**Pole: Nazwa tematu (`name`)**

**Warunki:**
1. **Wymagane pole**
   - Nie może być puste
   - Komunikat: "Nazwa tematu jest wymagana"
   - Wpływ na UI: Przycisk submit disabled

2. **Minimum 1 znak (po trim)**
   - Po usunięciu whitespace musi zostać przynajmniej 1 znak
   - Komunikat: "Nazwa tematu musi mieć co najmniej 1 znak"
   - Wpływ na UI: Przycisk submit disabled, error pod inputem

3. **Maximum 100 znaków**
   - Zgodnie z ValidationRules.topic.nameMaxLength
   - Komunikat: "Nazwa tematu może mieć maksymalnie 100 znaków"
   - Wpływ na UI: Przycisk submit disabled, error pod inputem, czerwony licznik znaków

4. **Trim whitespace**
   - Automatyczne usunięcie spacji na początku i końcu przed wysłaniem
   - Wpływ: wartość przesłana do API jest trimmed

**Implementacja walidacji:**
```typescript
const validateTopicName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: "Nazwa tematu jest wymagana",
    };
  }
  
  if (trimmedName.length > ValidationRules.topic.nameMaxLength) {
    return {
      isValid: false,
      error: `Nazwa tematu może mieć maksymalnie ${ValidationRules.topic.nameMaxLength} znaków`,
    };
  }
  
  return { isValid: true };
};
```

**Walidacja w czasie rzeczywistym:**
- Uruchamiana przy każdej zmianie wartości (onChange)
- Błędy wyświetlane pod inputem
- Przycisk submit disabled gdy formularz niepoprawny

**Walidacja przed submitem:**
- Dodatkowe sprawdzenie przed wysłaniem żądania
- Zapobiega wysłaniu nieprawidłowych danych nawet jeśli walidacja UI zawiodła

### 9.2 Walidacja przed wywołaniem API

**Lokalizacja:** Hook `useTopics`, funkcje `createTopic`, `updateTopic`

**Dodatkowe sprawdzenia:**
- Sprawdzenie czy nazwa po trim nie jest pusta
- Sprawdzenie długości (1-100 znaków)
- Sprawdzenie czy połączenie sieciowe jest dostępne (opcjonalnie)

**Komunikaty:**
- Błędy walidacji wyświetlane jako toast lub pod polem w formularzu
- Szczegółowe komunikaty dla każdego typu błędu

### 9.3 Walidacja odpowiedzi API

**Lokalizacja:** Hook `useTopics`, obsługa response

**Sprawdzenia:**
- Czy response.ok === true
- Czy response.status === 201 (POST) lub 200 (PUT/DELETE)
- Czy odpowiedź zawiera oczekiwane dane (TopicDto)
- Czy ID zwróconego tematu jest poprawne

**Obsługa niezgodności:**
- Jeśli odpowiedź nieprawidłowa: "Otrzymano nieprawidłowe dane z serwera"
- Jeśli brak ID: "Temat nie został poprawnie utworzony"

### 9.4 Walidacja unikalności nazwy (opcjonalnie - przyszłość)

**Uwaga:** W MVP nie jest wymagana, ale może być dodana w przyszłości

**Warunek:** Nazwa tematu powinna być unikalna w ramach użytkownika

**Implementacja:**
- Walidacja po stronie serwera (constraint w bazie danych)
- Zwracanie błędu 400 z komunikatem "Temat o takiej nazwie już istnieje"
- Wyświetlenie błędu pod inputem w formularzu

### 9.5 Walidacja uprawnień

**Warunek:** Użytkownik może edytować/usuwać tylko własne tematy

**Implementacja:**
- Sprawdzenie po stronie serwera (user_id w rekordzie)
- Zwracanie błędu 404 lub 403 jeśli temat nie należy do użytkownika
- Obsługa w UI: toast z komunikatem, odświeżenie listy

## 10. Obsługa błędów

### 10.1 Błędy ładowania listy tematów (GET /api/topics)

**Scenariusz 1: Błąd sieci (Network Error)**
- **Przyczyna:** Brak internetu, server offline
- **Obsługa:**
  - Komunikat: "Nie udało się pobrać listy tematów. Sprawdź połączenie internetowe."
  - Przycisk "Spróbuj ponownie"
  - Retry wywołuje `refreshTopics()`
- **Stan UI:** Alert z błędem, przycisk retry, lista ukryta

**Scenariusz 2: Błąd 401 Unauthorized**
- **Przyczyna:** Użytkownik niezalogowany, sesja wygasła
- **Obsługa:**
  - Toast: "Sesja wygasła. Zaloguj się ponownie."
  - Przekierowanie do strony logowania
- **Stan UI:** Redirect

**Scenariusz 3: Błąd 500 Server Error**
- **Przyczyna:** Problem po stronie serwera
- **Obsługa:**
  - Komunikat: "Wystąpił problem z serwerem. Spróbuj ponownie później."
  - Przycisk retry
- **Stan UI:** Alert z błędem i retry

**Scenariusz 4: Pusta lista (Success, ale data.length === 0)**
- **Przyczyna:** Użytkownik nie utworzył jeszcze żadnych tematów
- **Obsługa:**
  - Wyświetlenie EmptyState
  - Przycisk "Utwórz pierwszy temat"
- **Stan UI:** EmptyState component

### 10.2 Błędy tworzenia tematu (POST /api/topics)

**Scenariusz 1: Błąd 400 Validation Error**
- **Przyczyna:** Nieprawidłowe dane (np. nazwa > 100 znaków)
- **Obsługa:**
  - Parsowanie `error.details` z odpowiedzi
  - Wyświetlenie błędów pod inputem w formularzu
  - Dialog pozostaje otwarty
- **Stan UI:** Error message pod inputem, brak przycisku retry

**Scenariusz 2: Błąd 500 Server Error**
- **Przyczyna:** Problem z bazą danych lub serwerem
- **Obsługa:**
  - Toast: "Nie udało się utworzyć tematu. Spróbuj ponownie."
  - Dialog pozostaje otwarty
  - Użytkownik może ponownie kliknąć "Dodaj"
- **Stan UI:** Toast z błędem, dialog otwarty, przyciski odblokowane

**Scenariusz 3: Network Error**
- **Przyczyna:** Timeout, brak internetu
- **Obsługa:**
  - Toast: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
  - Dialog pozostaje otwarty
- **Stan UI:** Toast z błędem, dialog otwarty

**Scenariusz 4: Konflikt unikalności (przyszłość)**
- **Przyczyna:** Temat o takiej nazwie już istnieje
- **Obsługa:**
  - Błąd pod inputem: "Temat o takiej nazwie już istnieje"
  - Dialog pozostaje otwarty
- **Stan UI:** Error message, focus na input

### 10.3 Błędy edycji tematu (PUT /api/topics/:id)

**Scenariusz 1: Błąd 400 Validation Error**
- **Obsługa:** Jak w scenariuszu POST 400

**Scenariusz 2: Błąd 404 Not Found**
- **Przyczyna:** Temat został usunięty lub nie należy do użytkownika
- **Obsługa:**
  - Zamknięcie dialogu
  - Toast: "Temat nie został znaleziony. Lista została odświeżona."
  - Automatyczne wywołanie `refreshTopics()`
- **Stan UI:** Dialog zamyka się, toast z błędem, lista odświeża się

**Scenariusz 3: Błąd 500 Server Error**
- **Obsługa:**
  - Toast: "Nie udało się zaktualizować tematu. Spróbuj ponownie."
  - Dialog pozostaje otwarty
- **Stan UI:** Toast, dialog otwarty

**Scenariusz 4: Network Error**
- **Obsługa:** Jak w scenariuszu POST Network Error

### 10.4 Błędy usuwania tematu (DELETE /api/topics/:id)

**Scenariusz 1: Błąd 404 Not Found**
- **Przyczyna:** Temat już został usunięty lub nie należy do użytkownika
- **Obsługa:**
  - Zamknięcie dialogu
  - Toast: "Temat nie został znaleziony. Mógł zostać już usunięty."
  - Automatyczne wywołanie `refreshTopics()`
- **Stan UI:** Dialog zamyka się, toast, lista odświeża się

**Scenariusz 2: Błąd 409 Conflict (opcjonalnie)**
- **Przyczyna:** Temat ma powiązane pytania (jeśli constraint zaimplementowano)
- **Obsługa:**
  - Zamknięcie dialogu
  - Toast: "Nie można usunąć tematu, który ma powiązane pytania. Usuń najpierw pytania."
- **Stan UI:** Dialog zamyka się, toast z komunikatem

**Scenariusz 3: Błąd 500 Server Error**
- **Obsługa:**
  - Zamknięcie dialogu
  - Toast: "Nie udało się usunąć tematu. Spróbuj ponownie."
  - Użytkownik może ponownie kliknąć "Usuń" na temacie
- **Stan UI:** Dialog zamyka się, toast, lista bez zmian

**Scenariusz 4: Network Error**
- **Obsługa:**
  - Zamknięcie dialogu
  - Toast: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
- **Stan UI:** Dialog zamyka się, toast

### 10.5 Obsługa wielu błędów jednocześnie

**Strategia:**
- System kolejkowania toastów (max 3 widoczne)
- Priorytetyzacja: błędy krytyczne (401) > błędy operacji > info
- Auto-dismiss po 5 sekundach dla toastów informacyjnych
- Ręczne zamknięcie dla toastów błędów

### 10.6 Edge cases

**Edge case 1: Użytkownik otwiera wiele dialogów jednocześnie**
- **Obsługa:** Niemożliwe - maksymalnie jeden dialog otwarty naraz
- **Zapobieganie:** Stan dialogów w hooku zarządza tym automatycznie

**Edge case 2: Użytkownik edytuje temat, który został usunięty przez inną sesję**
- **Obsługa:** Błąd 404 z API, zamknięcie dialogu, odświeżenie listy
- **Komunikat:** "Temat nie istnieje już w systemie"

**Edge case 3: Użytkownik usuwa temat podczas gdy trwa jego edycja**
- **Obsługa:** Niemożliwe - tylko jeden dialog otwarty naraz

**Edge case 4: Użytkownik opuszcza stronę podczas operacji CRUD**
- **Obsługa:** Brak specjalnej obsługi w MVP (operacja się wykona, ale user nie zobaczy wyniku)
- **Przyszłość:** Warning przed opuszczeniem podczas submitting

**Edge case 5: Bardzo długa nazwa tematu (> 100 znaków)**
- **Obsługa:** Walidacja blokuje submit, komunikat błędu
- **UI:** Licznik znaków pokazuje przekroczenie limitu (np. "105 / 100" na czerwono)

**Edge case 6: Nazwa składająca się tylko z białych znaków**
- **Obsługa:** Trim przed walidacją, traktowane jako puste pole
- **Komunikat:** "Nazwa tematu jest wymagana"

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów
1. Utworzenie pliku strony: `src/pages/topics.astro`
2. Dodanie nowych typów ViewModel do `src/types.ts` lub osobnego pliku:
   - `TopicsViewState`
   - `DialogState`
   - `TopicFormData`
   - `ErrorMessage`
   - `TopicFormValidation`
3. Upewnienie się, że ValidationRules zawierają reguły dla tematów

### Krok 2: Implementacja endpoint GET /api/topics
1. Utworzenie pliku `src/pages/api/topics/index.ts`
2. Implementacja GET handler:
   - Pobranie user_id z locals (auth)
   - Query do Supabase: select topics where user_id = current_user
   - Zwrócenie listy TopicDto
   - Obsługa błędów
3. Testowanie endpointu (Postman/curl)

### Krok 3: Implementacja endpoint PUT /api/topics/[id].ts
1. Utworzenie pliku `src/pages/api/topics/[id].ts`
2. Implementacja PUT handler:
   - Parsowanie i walidacja body (UpdateTopicCommand)
   - Sprawdzenie ownership (topic belongs to user)
   - Update w bazie danych
   - Zwrócenie zaktualizowanego TopicDto
   - Obsługa błędów (404, 400, 500)
3. Testowanie endpointu

### Krok 4: Implementacja endpoint DELETE /api/topics/[id].ts
1. W tym samym pliku `src/pages/api/topics/[id].ts`
2. Implementacja DELETE handler:
   - Sprawdzenie ownership
   - Delete z bazy danych
   - Obsługa cascade (pytania powiązane z tematem)
   - Zwrócenie sukcesu (200 lub 204)
   - Obsługa błędów (404, 409, 500)
3. Testowanie endpointu

### Krok 5: Utworzenie custom hooka useTopics
1. Utworzenie pliku `src/lib/hooks/useTopics.ts`
2. Implementacja interfejsu `UseTopicsReturn`
3. Implementacja zarządzania stanem za pomocą `useState`
4. Implementacja funkcji `fetchTopics()` z obsługą błędów
5. Implementacja funkcji zarządzania dialogami:
   - `openAddDialog`, `closeAddDialog`
   - `openEditDialog`, `closeEditDialog`
   - `openDeleteDialog`, `closeDeleteDialog`
6. Implementacja funkcji CRUD:
   - `createTopic()` - POST /api/topics
   - `updateTopic()` - PUT /api/topics/:id
   - `deleteTopic()` - DELETE /api/topics/:id
7. Implementacja `refreshTopics()` i `clearError()`
8. Dodanie `useEffect` dla inicjalizacji (fetch topics)

### Krok 6: Implementacja komponentów pomocniczych (bottom-up)
1. **LoadingSpinner:**
   - Utworzenie `src/components/LoadingSpinner.tsx`
   - Animowany spinner (Shadcn lub custom CSS)
2. **EmptyState:**
   - Utworzenie `src/components/EmptyState.tsx`
   - Ikona, nagłówek, opis, przycisk CTA
3. **PageHeader:**
   - Utworzenie `src/components/PageHeader.tsx`
   - Tytuł + AddTopicButton

### Krok 7: Implementacja komponentu TopicForm
1. **TopicForm:**
   - Utworzenie `src/components/TopicForm.tsx`
   - Lokalny stan: `formData`, `validation`
   - NameInput z Shadcn Input
   - Walidacja w czasie rzeczywistym
   - Character counter (X / 100)
   - Przyciski: Cancel, Submit
   - Obsługa loading state

### Krok 8: Implementacja dialogów
1. **AddTopicDialog:**
   - Utworzenie `src/components/AddTopicDialog.tsx`
   - Wykorzystanie Shadcn Dialog
   - Osadzenie TopicForm
   - Obsługa onSubmit → wywołanie createTopic z hooka
   - Animacje open/close

2. **EditTopicDialog:**
   - Utworzenie `src/components/EditTopicDialog.tsx`
   - Podobnie jak AddTopicDialog
   - TopicForm z initialValue
   - Obsługa onSubmit → wywołanie updateTopic

3. **DeleteConfirmationDialog:**
   - Utworzenie `src/components/DeleteConfirmationDialog.tsx`
   - Wykorzystanie Shadcn AlertDialog
   - Wyświetlenie nazwy tematu w komunikacie
   - Przyciski: Cancel, Confirm (destructive)
   - Obsługa loading state podczas usuwania

### Krok 9: Implementacja komponentów listy tematów
1. **TopicActions:**
   - Utworzenie `src/components/TopicActions.tsx`
   - EditButton, DeleteButton z ikonami
   - Tooltips

2. **TopicDisplay:**
   - Utworzenie `src/components/TopicDisplay.tsx`
   - Wyświetlenie nazwy tematu
   - Formatowanie daty (np. "2 dni temu" używając biblioteki date-fns)

3. **TopicItem:**
   - Utworzenie `src/components/TopicItem.tsx`
   - Wykorzystanie Shadcn Card lub prosty div
   - Złożenie TopicDisplay + TopicActions
   - Hover effects

4. **TopicsList:**
   - Utworzenie `src/components/TopicsList.tsx`
   - Renderowanie array TopicItem
   - Grid lub stack layout
   - Nagłówek z liczbą tematów (opcjonalnie)

### Krok 10: Implementacja głównego komponentu widoku
1. **TopicsView:**
   - Utworzenie `src/components/TopicsView.tsx`
   - Użycie hooka `useTopics`
   - Warunkowe renderowanie:
     - isLoading → LoadingSpinner
     - error → ErrorAlert z retry
     - topics.length === 0 → EmptyState
     - topics.length > 0 → PageHeader + TopicsList
   - Renderowanie wszystkich dialogów (kontrolowane przez stan z hooka)
   - Przekazanie callbacków do komponentów dzieci

### Krok 11: Implementacja strony Astro
1. **topics.astro:**
   - Utworzenie struktury strony z Layout
   - Import `TopicsView` jako client component
   - Dodanie dyrektywy `client:load`
   - Stylowanie kontenera (Tailwind)
   - Meta tags i tytuł: "Moje tematy | EduKids"

### Krok 12: Stylowanie i responsywność
1. Dodanie klas Tailwind dla layoutu widoku
2. Responsywność listy tematów:
   - Desktop: grid 2-3 kolumny lub lista z hoverem
   - Tablet: grid 2 kolumny
   - Mobile: stack pionowo
3. Responsywność dialogów:
   - Desktop: centered modal
   - Mobile: pełnoekranowy lub prawie pełnoekranowy
4. Animacje i transitions:
   - Fade-in dla nowych tematów
   - Fade-out dla usuniętych tematów
   - Smooth dialog open/close
   - Hover effects na liście
5. Accessibility:
   - ARIA labels dla przycisków z ikonami
   - Focus management w dialogach
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader support

### Krok 13: Integracja z systemem toastów
1. Instalacja i konfiguracja toast library (np. sonner lub Shadcn toast)
2. Utworzenie toast helpera `src/lib/toast.ts` (opcjonalnie)
3. Dodanie wywołań toast w hooku useTopics:
   - Sukces utworzenia: "Temat został utworzony"
   - Sukces edycji: "Temat został zaktualizowany"
   - Sukces usunięcia: "Temat został usunięty"
   - Błędy z odpowiednimi komunikatami
4. Konfiguracja auto-dismiss i pozycji toastów

### Krok 14: Testowanie
1. Test przepływu happy path:
   - Ładowanie listy tematów
   - Dodawanie nowego tematu
   - Edycja tematu
   - Usuwanie tematu
2. Test błędów:
   - Błąd ładowania listy (symulacja offline)
   - Błąd tworzenia (walidacja, server error)
   - Błąd edycji (404, 500)
   - Błąd usuwania (404, 409, 500)
3. Test walidacji:
   - Puste pole nazwy
   - Nazwa > 100 znaków
   - Nazwa składająca się z samych spacji
4. Test interakcji:
   - Anulowanie dialogów
   - Zamykanie dialogów przez X
   - Escape key
   - Click poza dialogiem (backdrop)
5. Test responsywności:
   - Desktop, tablet, mobile
   - Różne rozdzielczości
6. Test accessibility:
   - Nawigacja klawiaturą
   - Screen reader
   - Focus trap w dialogach

### Krok 15: Optymalizacje i poprawki
1. Optymalizacja re-renderów (React.memo, useMemo, useCallback)
2. Dodanie loading skeletons zamiast spinnerów (opcjonalnie)
3. Implementacja debouncing dla walidacji (jeśli potrzebne)
4. Poprawki UX na podstawie testów
5. Code review i refactoring
6. Usunięcie console.log i komentarzy debugowych

### Krok 16: Integracja z widokiem Generate Questions
1. Upewnienie się, że widok `/generate` poprawnie pobiera zaktualizowaną listę tematów
2. Testowanie przepływu: utworzenie tematu w `/topics` → generowanie pytań w `/generate`
3. Testowanie edge case: usunięcie tematu podczas gdy jest wybrany w formularzu generowania

### Krok 17: Dokumentacja
1. Dodanie komentarzy JSDoc do wszystkich komponentów
2. Dokumentacja API endpoints w komentarzach
3. Aktualizacja README z opisem widoku
4. Screenshoty/diagramy (opcjonalnie)

