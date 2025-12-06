# Testing Environment - Quick Start Guide

Environment testowy został w pełni skonfigurowany i jest gotowy do użycia! 🎉

## ✅ Co zostało zainstalowane?

### Testy jednostkowe (Vitest)
- ✅ Vitest + UI + Coverage
- ✅ jsdom i happy-dom
- ✅ @testing-library/react + jest-dom + user-event
- ✅ @vitejs/plugin-react

### Testy E2E (Playwright)
- ✅ @playwright/test
- ✅ Przeglądarka Chromium
- ✅ Generatory testów i narzędzia debugowania

## 🚀 Szybki start

### Uruchom testy jednostkowe
```bash
npm run test              # Uruchom wszystkie testy
npm run test:watch        # Tryb watch (do developmentu)
npm run test:coverage     # Z raportem pokrycia
npm run test:ui           # Interaktywny UI
```

### Uruchom testy E2E
```bash
npm run test:e2e          # Uruchom testy e2e
npm run test:e2e:ui       # Interaktywny tryb
npm run test:e2e:debug    # Z debuggerem
npm run test:e2e:codegen  # Generuj testy automatycznie
npm run test:e2e:report   # Pokaż raport HTML
```

## 📁 Struktura katalogów

```
tests/
├── setup.ts                    # Globalna konfiguracja testów
├── README.md                   # Szczegółowa dokumentacja
├── e2e/                       # Testy end-to-end (Playwright)
│   ├── pages/                 # Page Object Models
│   │   ├── BasePage.ts       # Bazowa klasa strony
│   │   └── HomePage.ts       # Obiekt strony głównej
│   ├── fixtures/             # Dane testowe
│   └── *.spec.ts             # Pliki testów e2e
└── unit/                     # Testy jednostkowe (Vitest)
    ├── services/             # Testy warstwy serwisowej
    ├── validators/           # Testy walidatorów
    └── hooks/                # Testy hooków React
```

## 📝 Przykłady testów

Utworzono przykładowe testy pokazujące best practices:

### 1. Testy jednostkowe
- ✅ `tests/unit/services/topics.service.test.ts` - Testowanie serwisów z mockowaniem
- ✅ `tests/unit/validators/topics.validators.test.ts` - Testowanie walidatorów
- ✅ `tests/unit/hooks/useTopics.test.tsx` - Testowanie hooków React

### 2. Testy E2E z Page Object Model
- ✅ `tests/e2e/pages/BasePage.ts` - Bazowa klasa z funkcjonalnościami
- ✅ `tests/e2e/pages/HomePage.ts` - Przykładowy Page Object
- ✅ `tests/e2e/home.spec.ts` - Przykładowe testy E2E z visual regression

## ⚙️ Konfiguracja

### `vitest.config.ts`
- Środowisko jsdom dla testów DOM
- Pokrycie kodu z progiem 70% dla services i validators
- Aliasy ścieżek zgodne z projektem
- Automatyczne czyszczenie po testach

### `playwright.config.ts`
- Tylko Chromium (zgodnie z wytycznymi)
- Równoległe wykonywanie testów
- Automatyczne uruchamianie dev servera
- Zbieranie trace, screenshot i video przy błędach
- Izolacja kontekstów przeglądarki

## 🎯 Wymagania pokrycia

Minimum 70% pokrycia dla:
- `src/lib/services/**/*.ts`
- `src/lib/validators/**/*.ts`
- `src/lib/hooks/**/*.ts`

Sprawdź pokrycie:
```bash
npm run test:coverage
```

## 📚 Dokumentacja

- Szczegółowa dokumentacja: `tests/README.md`
- Pełny raport setupu: `.ai/testing-setup.md`
- Wytyczne Vitest: `.ai/vitest-unit-testing.mdc`
- Wytyczne Playwright: `.ai/playwright-e2e-testing.mdc`

## ✨ Następne kroki

1. **Zastąp przykładowe testy prawdziwymi**
   - Zaimplementuj testy dla istniejących serwisów
   - Dodaj testy dla wszystkich walidatorów
   - Przetestuj wszystkie hooki React

2. **Utwórz Page Objects dla wszystkich stron**
   - Login, Register, Topics, Generate, Settings
   - Wykorzystaj wzorzec dziedziczenia z `BasePage`

3. **Napisz testy E2E dla kluczowych ścieżek użytkownika**
   - Rejestracja i logowanie
   - Tworzenie i edycja tematów
   - Generowanie pytań
   - Zarządzanie kontem

4. **Dodaj testy do CI/CD**
   ```yaml
   - name: Run tests
     run: |
       npm run test:coverage
       npm run test:e2e
   ```

5. **Rozważ dodanie testów do pre-commit**
   ```json
   "lint-staged": {
     "*.{ts,tsx}": ["eslint --fix", "vitest related --run"]
   }
   ```

## 🐛 Debugowanie

### Vitest
```bash
# Szczegółowe logi
npm run test -- --reporter=verbose

# Debug konkretnego testu
npm run test -- --inspect-brk nazwa-testu.test.ts
```

### Playwright
```bash
# Interaktywny debugger
npm run test:e2e:debug

# Zobacz trace dla nieudanych testów
npx playwright show-trace test-results/trace.zip
```

## ✅ Weryfikacja instalacji

Uruchom to polecenie aby sprawdzić czy wszystko działa:
```bash
npm run test
```

Wynik: ✅ **22 testy przeszły pomyślnie!**

## 🎓 Best Practices

### Testy jednostkowe
- ✅ Używaj wzorca Arrange-Act-Assert
- ✅ Mockuj zewnętrzne zależności
- ✅ Testuj zarówno happy path jak i edge cases
- ✅ Stosuj opisowe nazwy testów
- ✅ Trzymaj testy skoncentrowane i izolowane

### Testy E2E
- ✅ Używaj wzorca Page Object Model
- ✅ Preferuj semantyczne selektory (getByRole, getByLabel)
- ✅ Wykorzystuj auto-waiting Playwright
- ✅ Testuj tylko krytyczne ścieżki użytkownika
- ✅ Uruchamiaj testy równolegle dla szybkości

---

**Status:** ✅ Gotowe do użycia
**Data:** 2025-11-23
**Wersja:** 1.0.0

