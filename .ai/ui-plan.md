# Architektura UI dla EduKids

## 1. Przegląd struktury UI

Aplikacja zbudowana przy użyciu Astro 5 z React 19 dla komponentów interaktywnych, TypeScript 5, Tailwind 4 oraz Shadcn/ui. Struktura opiera się na:
- `src/pages` – strony Astro
- `src/layouts` – globalny layout
- `src/components` – komponenty UI (statyczne Astro i dynamiczne React)
- `src/lib` – usługi i helpery

### Kluczowe założenia
- Oddzielenie logiki i prezentacji
- Responsywność mobile-first
- Dostępność (WCAG 2.1 AA)
- Bezpieczeństwo: walidacja Zod, RLS policies, XSS/CSRF protection

## 2. Lista widoków

### 2.1 Landing Page
- Ścieżka: `/`
- Cel: prezentacja platformy, CTA (Zaloguj / Zarejestruj)
- Info: krótki opis, przyciski CTA
- Komponenty: Hero, Button (Shadcn/ui), Navbar publiczny
- UX/A11Y/Security: semantyczny HTML, aria-label dla przycisków

### 2.2 Rejestracja
- Ścieżka: `/register`
- Cel: tworzenie konta użytkownika przez Supabase Auth
- Info: formularz email, hasło
- Komponenty: Form, Input, Button, Alert dla błędów
- UX: inline validation, focus management

### 2.3 Logowanie
- Ścieżka: `/login`
- Cel: uwierzytelnienie użytkownika
- Info: formularz credentials, obsługa błędów
- Komponenty: Form, Input, Button, Alert

### 2.4 Dashboard (Home)
- Ścieżka: `/dashboard`
- Cel: podsumowanie statystyk (liczba tematów, pytań)
- Info: kartki statystyk, szybkie akcje (Generuj pytania, Moje pytania, Moje tematy)
- Komponenty: Card, Grid, Button
- UX: klikalne kafelki, aria role dla statystyk

### 2.5 Generuj pytania
- Ścieżka: `/generate`
- Cel: generowanie pytań AI na bazie wieku, tematu, liczby
- Info: dropdown tematów, dropdown grup wiekowych, liczba pytań, spinner, lista propozycji
- Komponenty: Select, Slider/Input, Button, Spinner, Card (pytanie)
- UX: loading state, error toast (retry)

### 2.6 Moje pytania
- Ścieżka: `/questions`
- Cel: zarządzanie pytaniami (filtrowanie, edycja, usuwanie)
- Info: tabs statusów (Wszystkie, Zaakceptowane, Oczekujące, Odrzucone), sortowanie, filtry (wiek, temat), paginacja
- Komponenty: Tabs, Dropdown Menu, Table/Card list, Pagination, Modal (edycja pytania), Confirmation Dialog
- UX/A11Y: keyboard navigation, aria-controls dla tabs

### 2.7 Moje tematy
- Ścieżka: `/topics`
- Cel: CRUD tematów
- Info: lista tematów, dodawanie, edycja inline lub modal, usuwanie z potwierdzeniem
- Komponenty: List, Form, Modal, Confirmation Dialog

### 2.8 Dialogi globalne
- Edycja pytania – Modal z Shadcn/ui Dialog
- Confirmation – potwierdzenie usuwania pytania/tematu
- Toast – powiadomienia o błędach i sukcesie

## 3. Mapa podróży użytkownika

1. Użytkownik odwiedza Landing Page → wybiera Rejestrację lub Logowanie
2. Po zalogowaniu przechodzi do Dashboard → wybiera Generuj pytania
3. Wypełnia formularz generowania → wyświetlane propozycje
4. Akceptuje/Odrzuca/Edycja pytania → pytania z statusami
5. Przechodzi do Moje pytania → zarządza pytaniami (filtruje, edytuje, usuwa)
6. Przechodzi do Moje tematy → zarządza tematami (CRUD)
7. Wylogowuje się przez menu użytkownika

## 4. Układ i struktura nawigacji

- Top Navigation Bar (protected): Logo (link do Dashboard), Menu główne (Dashboard, Generuj pytania, Moje pytania, Moje tematy), Menu użytkownika (Avatar + Logout)
- Sidebar (opcjonalnie) – na desktopie można rozważyć boczne menu
- Mobile: Hamburger menu z tymi samymi opcjami
- Breadcrumbs – na stronach generowania i zarządzania do orientacji kontekstowej

## 5. Kluczowe komponenty

- Button (Shadcn/ui) – CTA i akcje
- Input, Select, Slider – formularze
- Card – prezentacja pytań i statystyk
- Tabs, Dropdown Menu – filtrowanie i sortowanie
- Modal/Dialog – edycja i potwierdzenia
- Toast – powiadomienia
- Spinner/Loader – loading states
- Alert – komunikaty błędów
