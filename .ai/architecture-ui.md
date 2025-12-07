# Podsumowanie planowania architektury UI dla MVP EduKids

## Decyzje

### Seria 1 - Podstawowe decyzje architektoniczne:
1. **Landing page**: Aplikacja będzie miała dedykowany ekran powitalny dla niezalogowanych użytkowników z opisem platformy i przyciskami CTA (Zaloguj się / Zarejestruj się)
2. **Zarządzanie tematami**: Dedykowany widok "Moje tematy" z pełnym interfejsem CRUD
3. **Proces akceptacji pytań**: Wszystkie wygenerowane pytania wyświetlają się jednocześnie na jednym ekranie z indywidualnymi akcjami przy każdym
4. **Zestawy pytań**: Funkcjonalność zestawów pytań (question sets) zostanie zaimplementowana w późniejszym etapie, poza MVP
5. **Nawigacja główna**: Top navigation bar z menu głównym i menu użytkownika (avatar + dropdown), na mobile: hamburger menu
6. **Widok "Moje pytania"**: Domyślnie pokazuje zaakceptowane pytania z widocznym filtrem statusu w formie tabs (Wszystkie / Zaakceptowane / Oczekujące / Odrzucone)
7. **Edycja pytań**: Modal/dialog z wykorzystaniem Shadcn/ui Dialog component
8. **Dashboard**: Prosty dashboard po zalogowaniu z kafelkami statystyk, szybkimi akcjami i ostatnią aktywnością
9. **Obsługa błędów API**: Toast notification z komunikatem błędu + przycisk "Spróbuj ponownie"
10. **Grupy wiekowe**: Predefiniowane grupy wiekowe jako główny interfejs w filtrach, z możliwością wprowadzenia dokładnego wieku w formularzu generowania

### Seria 2 - Szczegóły implementacyjne:
11. **Formularz generowania**: Pojedynczy, kompaktny formularz ze wszystkimi polami (temat dropdown, wiek dropdown, liczba pytań)
12. **Loading state**: Prosty spinner podczas generowania pytań przez AI
13. **Karta pytania**: Karta z treścią pytania, małymi badge'ami (grupa wiekowa, temat) i akcjami (Edytuj/Usuń)
14. **Statystyki tematów**: W MVP nie będą wyświetlane dodatkowe statystyki przy tematach (tylko nazwa)
15. **Usuwanie tematu**: Prosta informacja w confirmation dialog bez sprawdzania liczby pytań: "Temat i wszystkie powiązane pytania zostaną usunięte"
16. **Interaktywny dashboard**: Statystyki będą klikalne i prowadzić do odpowiednich widoków z filtrami
17. **Zarządzanie kontem**: Nie będzie implementowane w MVP
18. **Edycja pytania w modalu**: Metadane (wiek, temat, status) widoczne jako read-only + edytowalne pole tekstowe
19. **Sortowanie pytań**: Domyślnie po dacie utworzenia (najnowsze pierwsze) z dropdownem sortowania
20. **Paginacja**: Klasyczna paginacja z numerami stron dla wszystkich urządzeń w MVP

## Dopasowane rekomendacje

### Struktura aplikacji i nawigacja:
1. **Landing page** z prostym opisem platformy i dwoma przyciskami CTA zwiększy konwersję i da użytkownikom kontekst przed rejestracją
2. **Top navigation bar** ze standardowym układem (logo, menu główne, menu użytkownika) zapewni intuicyjność i znajomość interfejsu
3. **Dashboard jako centrum nawigacji** z interaktywnymi statystykami da użytkownikowi orientację i szybki dostęp do głównych funkcji

### Główne przepływy użytkownika:
4. **Pojedynczy formularz generowania pytań** ze wszystkimi polami przyspieszy proces i zmniejszy liczbę kliknięć
5. **Wyświetlanie wszystkich pytań na jednym ekranie** pozwoli użytkownikowi zobaczyć cały kontekst zestawu i szybciej podejmować decyzje
6. **Dedykowany widok "Moje tematy"** z pełnym CRUD zapewni przejrzystość i łatwość zarządzania

### Zarządzanie danymi i filtrowanie:
7. **Tabs dla statusów pytań** (Wszystkie / Zaakceptowane / Oczekujące / Odrzucone) uproszczą główny use case, zachowując dostęp do pełnej historii
8. **Sortowanie po dacie utworzenia** (najnowsze pierwsze) odpowiada naturalnemu workflow użytkownika
9. **Grupy wiekowe jako główny interfejs** zwiększą użyteczność przy zachowaniu elastyczności (dokładny wiek w API)

### Komponenty UI i interakcje:
10. **Modal/dialog dla edycji pytań** (Shadcn/ui) zachowa kontekst i nie wymaga przeładowania strony
11. **Karty pytań z treścią, badge'ami i akcjami** zachowają czytelność przy dostępie do kontekstu
12. **Metadane jako read-only w modalu edycji** dadzą kontekst i zapobiegną pomyłkom

### Obsługa błędów i feedback:
13. **Toast notifications** dla błędów API z przyciskiem "Spróbuj ponownie" zminimalizują frustrację użytkownika
14. **Prosty spinner** podczas generowania pytań zapewni feedback bez nadmiernej złożoności w MVP
15. **Confirmation dialog przy usuwaniu** z jasną informacją o konsekwencjach zapewni bezpieczeństwo danych

### Wydajność i UX:
16. **Klasyczna paginacja** zapewni kontrolę i wydajność, szczególnie przy dużych zbiorach danych z API
17. **Responsywny design** z hamburger menu na mobile zapewni dostępność na różnych urządzeniach

## Podsumowanie planowania architektury UI

### 1. Główne wymagania dotyczące architektury UI

Aplikacja EduKids będzie zbudowana w oparciu o **Astro 5** z **React 19** dla komponentów interaktywnych, **TypeScript 5**, **Tailwind 4** i **Shadcn/ui**. Architektura UI skupia się na prostocie i efektywności dla MVP, z naciskiem na główny przepływ: generowanie pytań przez AI i zarządzanie biblioteką pytań.

#### Kluczowe założenia MVP:
- Funkcjonalność zestawów pytań (question sets) poza zakresem MVP
- Zarządzanie kontem użytkownika poza zakresem MVP
- Brak zaawansowanych statystyk (np. liczba pytań per temat)
- Prosty feedback UI (spinner, toast notifications)
- Klasyczna paginacja dla wszystkich urządzeń

### 2. Kluczowe widoki, ekrany i przepływy użytkownika

#### A. Widoki publiczne (niezalogowani):
**Landing Page**
- Opis platformy i value proposition
- Dwa główne CTA: "Zaloguj się" i "Zarejestruj się"
- Responsywny layout

**Rejestracja / Logowanie**
- Formularze obsługiwane przez Supabase Auth
- Walidacja email i hasła
- Obsługa błędów z komunikatami

#### B. Widoki chronione (zalogowani):

**Dashboard (Home Screen)**
- Struktura:
  - Statystyki w kafelkach (liczba pytań, tematów) - **interaktywne, klikalne**
  - Szybkie akcje: "Generuj pytania", "Przeglądaj bibliotekę"
  - Ostatnia aktywność
- Nawigacja: Top bar z logo, menu główne, avatar + dropdown
- Mobile: Hamburger menu

**Generuj pytania**
- Pojedynczy, kompaktny formularz:
  - Dropdown wyboru tematu (z możliwością szybkiego dodania nowego)
  - Dropdown grup wiekowych (3-5 lat, 6-8 lat, 9-12 lat, etc.)
  - Input/slider liczby pytań (max 10)
  - Przycisk "Generuj"
- Loading state: Prosty spinner
- Po wygenerowaniu: Lista wszystkich pytań na jednym ekranie
- Każde pytanie z akcjami: Akceptuj / Odrzuć / Edytuj
- Obsługa błędów: Toast z przyciskiem "Spróbuj ponownie"

**Moje pytania (Biblioteka)**
- Tabs filtrowania statusu:
  - Wszystkie
  - Zaakceptowane (domyślny)
  - Oczekujące
  - Odrzucone
- Dropdown sortowania:
  - Najnowsze (domyślny)
  - Najstarsze
  - Alfabetycznie A-Z
- Filtry: grupa wiekowa, temat
- Karty pytań zawierające:
  - Treść pytania (główny tekst)
  - Badge'e: grupa wiekowa, temat
  - Akcje: Edytuj, Usuń
- Klasyczna paginacja z numerami stron (max 5 widocznych + first/last)

**Moje tematy**
- Lista tematów (tylko nazwy w MVP)
- Akcje CRUD:
  - Dodaj nowy temat (przycisk + modal/formularz)
  - Edytuj temat (inline lub modal)
  - Usuń temat (confirmation dialog: "Temat i wszystkie powiązane pytania zostaną usunięte")
- Paginacja

#### C. Modalne i dialogi:

**Modal edycji pytania**
- Metadane read-only (badge'e lub disabled fields):
  - Grupa wiekowa
  - Temat
  - Status
- Edytowalne pole tekstowe z treścią pytania
- Przyciski: Zapisz, Anuluj
- Implementacja: Shadcn/ui Dialog

**Confirmation dialogs**
- Usuwanie tematu
- Usuwanie pytania
- Standardowa struktura: Tytuł, Treść, Anuluj, Potwierdź

### 3. Strategia integracji z API i zarządzania stanem

#### Integracja z API:
- **Supabase Client** z `context.locals` w Astro routes
- **JWT Authentication** via `Authorization: Bearer <token>`
- **Endpointy wykorzystywane w MVP**:
  - `GET /api/topics` - lista tematów (z paginacją)
  - `POST /api/topics` - tworzenie tematu
  - `PUT /api/topics/:id` - edycja tematu
  - `DELETE /api/topics/:id` - usuwanie tematu
  - `POST /api/questions/generate` - generowanie pytań przez AI
  - `GET /api/questions` - lista pytań (z filtrowaniem i paginacją)
  - `PATCH /api/questions/:id` - edycja pytania (content, status)
  - `DELETE /api/questions/:id` - usunięcie pytania

#### Zarządzanie stanem:
- **React state** dla komponentów interaktywnych (formularze, modalne)
- **URL params** dla filtrów i paginacji (umożliwia bookmarking i sharing)
- **Optimistic updates** dla lepszego UX (np. przy akceptacji pytań)
- **Cache invalidation** po mutacjach (dodanie/edycja/usunięcie)

#### Przepływ danych:
1. **Generowanie pytań**:
   - User wypełnia formularz → POST `/api/questions/generate`
   - Spinner podczas oczekiwania
   - Pytania zapisywane jako `status: "pending"`
   - Wyświetlenie listy z akcjami
   - User akceptuje/odrzuca → PATCH `/api/questions/:id` z `status: "accepted"/"rejected"`

2. **Zarządzanie tematami**:
   - Lista: GET `/api/topics?page=1&limit=10`
   - Dodanie: POST `/api/topics` → refresh listy
   - Edycja: PUT `/api/topics/:id` → update w liście
   - Usunięcie: DELETE `/api/topics/:id` → usunięcie z listy

3. **Biblioteka pytań**:
   - GET `/api/questions?status=accepted&page=1&limit=10&sort_by=created_at&order=desc`
   - Filtry i sortowanie przez URL params
   - Edycja przez modal → PATCH → update w liście

### 4. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa

#### Responsywność:
- **Mobile-first approach** z Tailwind 4
- **Breakpoints**:
  - Mobile: < 768px (hamburger menu)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Top navigation**:
  - Desktop: pełne menu
  - Mobile: hamburger menu
- **Karty pytań**: stack na mobile, grid na desktop
- **Paginacja**: klasyczna dla wszystkich urządzeń w MVP

#### Dostępność:
- **Semantic HTML** (Astro wspiera to natywnie)
- **ARIA labels** dla interaktywnych elementów
- **Keyboard navigation** (focus states, tab order)
- **Color contrast** zgodny z WCAG 2.1 AA
- **Shadcn/ui components** mają wbudowaną dostępność

#### Bezpieczeństwo:
- **Supabase Auth** dla autentykacji
- **JWT tokens** w Authorization header
- **RLS policies** na poziomie bazy danych (`user_id = auth.uid()`)
- **Walidacja input** na froncie (Zod schemas) i backendie
- **XSS protection** przez React (escaped content)
- **CSRF protection** przez Supabase
- Brak zarządzania kontem w MVP (zmiana hasła, usunięcie konta) - do późniejszej implementacji

### 5. Komponenty UI i biblioteki

#### Shadcn/ui components wykorzystywane w MVP:
- **Button** - akcje, CTA
- **Dialog** - modalne (edycja pytania, confirmation)
- **Dropdown Menu** - menu użytkownika, sortowanie
- **Input** - formularze
- **Select** - dropdown wyboru (temat, wiek)
- **Tabs** - filtrowanie statusów pytań
- **Toast** - notyfikacje (błędy, sukcesy)
- **Badge** - metadane pytań (wiek, temat, status)
- **Card** - karty pytań, kafelki dashboardu
- **Spinner/Loader** - loading states

#### Wzorce projektowe:
- **Compound components** dla złożonych UI (np. lista pytań z akcjami)
- **Controlled components** dla formularzy
- **Portal pattern** dla modali i toastów (Shadcn/ui)
- **Composition over inheritance** (React best practices)

### 6. Strategia obsługi błędów

#### Błędy API:
- **Toast notifications** z komunikatem błędu
- **Przycisk "Spróbuj ponownie"** dla operacji, które można powtórzyć
- **Zachowanie stanu formularza** przy błędzie generowania pytań
- **Graceful degradation** - częściowe wyniki jeśli dostępne

#### Walidacja:
- **Client-side validation** (Zod schemas) przed wysłaniem do API
- **Inline error messages** w formularzach
- **Disabled submit buttons** do czasu poprawnej walidacji

#### Kody błędów HTTP:
- 400 Bad Request - błędy walidacji (komunikat z API)
- 401 Unauthorized - redirect do logowania
- 403 Forbidden - komunikat "Brak dostępu"
- 404 Not Found - komunikat "Nie znaleziono"
- 500 Internal Server Error - ogólny komunikat błędu + "Spróbuj ponownie"

### 7. Struktura nawigacji

```
Landing Page (public)
├── Zaloguj się → Login Page
└── Zarejestruj się → Register Page

Dashboard (protected) - Top Navigation:
├── Logo (link do Dashboard)
├── Menu główne:
│   ├── Dashboard (home icon)
│   ├── Generuj pytania
│   ├── Moje pytania
│   └── Moje tematy
└── Menu użytkownika (avatar + dropdown):
    └── Wyloguj się

Mobile: Hamburger menu z tymi samymi opcjami
```

### 8. Mapowanie API endpoints do widoków UI

| Widok | Endpoint | Metoda | Cel |
|-------|----------|--------|-----|
| Dashboard | `/api/questions` | GET | Statystyki (count) |
| Dashboard | `/api/topics` | GET | Statystyki (count) |
| Generuj pytania | `/api/topics` | GET | Lista tematów do wyboru |
| Generuj pytania | `/api/questions/generate` | POST | Generowanie pytań AI |
| Generuj pytania | `/api/questions/:id` | PATCH | Akceptacja/odrzucenie |
| Moje pytania | `/api/questions` | GET | Lista z filtrami |
| Moje pytania | `/api/questions/:id` | PATCH | Edycja treści |
| Moje pytania | `/api/questions/:id` | DELETE | Usunięcie |
| Moje tematy | `/api/topics` | GET | Lista tematów |
| Moje tematy | `/api/topics` | POST | Dodanie tematu |
| Moje tematy | `/api/topics/:id` | PUT | Edycja tematu |
| Moje tematy | `/api/topics/:id` | DELETE | Usunięcie tematu |

## Nierozwiązane kwestie

### Kwestie wymagające dalszego wyjaśnienia:

1. **Dokładne grupy wiekowe**: Jakie konkretnie przedziały wiekowe powinny być dostępne w dropdownie? (np. 3-5, 6-8, 9-12, 13-15 lat?)

2. **Limit tematów**: Czy użytkownik może mieć nieograniczoną liczbę tematów, czy powinien być jakiś limit w MVP?

3. **Dashboard - ostatnia aktywność**: Jakie dokładnie informacje powinny się wyświetlać w sekcji "ostatnia aktywność"? (ostatnio wygenerowane pytania, ostatnio edytowane tematy?)

4. **Timeout generowania AI**: Jaki jest maksymalny czas oczekiwania na odpowiedź z API AI przed pokazaniem błędu?

5. **Domyślna liczba pytań**: Jaka powinna być domyślna wartość w polu "liczba pytań" w formularzu generowania? (5, 10?)

6. **Limit paginacji**: Jaka powinna być domyślna i maksymalna liczba elementów na stronie dla list (pytania, tematy)?

7. **Edycja pytania pending**: Czy użytkownik może edytować pytanie ze statusem "pending" przed jego zaakceptowaniem, czy tylko po akceptacji?

8. **Zmiana statusu pytania**: Czy zaakceptowane pytanie może zostać z powrotem odrzucone, czy status jest finalny?

9. **Branding i kolory**: Jaka paleta kolorów powinna być użyta w aplikacji? Czy istnieje już logo/branding?

10. **Polityka prywatności**: Mimo że jest poza zakresem MVP, czy powinien być jakiś disclaimer o przetwarzaniu danych na landing page?

### Kwestie techniczne do rozstrzygnięcia w implementacji:

11. **Struktura folderów komponentów**: Jak organizować komponenty React w strukturze Astro? (per feature, per type?)

12. **State management library**: Czy wystarczy React state + URL params, czy potrzebny będzie Zustand/Jotai dla bardziej złożonego stanu?

13. **API client**: Czy stworzyć wrapper/abstraction layer nad Supabase client dla łatwiejszego testowania i maintainability?

14. **Error boundary**: Czy implementować React Error Boundary dla graceful error handling?

15. **Loading states**: Czy oprócz spinnera potrzebne są skeleton screens dla lepszego UX?

