# Lista kontrolna testowania widoku "Moje tematy"

## ✅ Testy funkcjonalne

### Ładowanie listy tematów
- [ ] Spinner wyświetla się podczas ładowania
- [ ] Lista tematów pojawia się po załadowaniu
- [ ] EmptyState wyświetla się gdy brak tematów
- [ ] Błąd wyświetla się gdy API nie odpowiada

### Dodawanie tematu
- [ ] Dialog otwiera się po kliknięciu "Dodaj temat"
- [ ] Input ma auto-focus
- [ ] Walidacja działa w czasie rzeczywistym
- [ ] Character counter pokazuje (X / 100)
- [ ] Przycisk "Dodaj" jest disabled gdy pole puste
- [ ] Przycisk "Dodaj" jest disabled gdy > 100 znaków
- [ ] Toast sukcesu pojawia się po utworzeniu
- [ ] Nowy temat pojawia się na liście
- [ ] Dialog zamyka się automatycznie po sukcesie
- [ ] Toast błędu pojawia się przy błędzie API
- [ ] Dialog pozostaje otwarty przy błędzie

### Edycja tematu
- [ ] Dialog otwiera się z wypełnionym polem
- [ ] Walidacja działa tak samo jak w dodawaniu
- [ ] Toast sukcesu pojawia się po aktualizacji
- [ ] Nazwa tematu aktualizuje się na liście
- [ ] Dialog zamyka się automatycznie po sukcesie
- [ ] Toast "Temat nie został znaleziony" przy 404
- [ ] Lista odświeża się przy 404

### Usuwanie tematu
- [ ] AlertDialog otwiera się z nazwą tematu
- [ ] Komunikat ostrzeżenia jest wyświetlony
- [ ] Przycisk "Usuń" ma destructive style
- [ ] Loading state wyświetla się podczas usuwania
- [ ] Toast sukcesu pojawia się po usunięciu
- [ ] Temat znika z listy
- [ ] Dialog zamyka się automatycznie
- [ ] EmptyState pojawia się gdy usunięto ostatni temat

## ✅ Testy walidacji

### Pole nazwy tematu
- [ ] Błąd "Nazwa tematu jest wymagana" gdy pole puste
- [ ] Błąd "...maksymalnie 100 znaków" gdy > 100
- [ ] Nazwa składająca się z samych spacji → "jest wymagana"
- [ ] Trim działa przed wysłaniem (spacje usunięte)
- [ ] Character counter czerwienieje gdy > 100

## ✅ Testy interakcji

### Dialogi
- [ ] Click X zamyka dialog (add/edit)
- [ ] Click "Anuluj" zamyka dialog
- [ ] Click backdrop zamyka dialog
- [ ] Escape key zamyka dialog
- [ ] Keyboard navigation działa (Tab)
- [ ] Enter submituje formularz (gdy valid)

### Lista tematów
- [ ] Hover na TopicItem pokazuje shadow
- [ ] Click Edit otwiera EditDialog z danymi
- [ ] Click Delete otwiera DeleteConfirmationDialog
- [ ] Tooltips działają na przyciskach akcji

## ✅ Testy responsywności

### Desktop (> 768px)
- [ ] Lista w grid 2 kolumny
- [ ] PageHeader w jednej linii
- [ ] Dialogi są centered

### Tablet (768px)
- [ ] Lista w grid 2 kolumny
- [ ] PageHeader stackuje się

### Mobile (< 768px)
- [ ] Lista w jednej kolumnie
- [ ] PageHeader stackuje się
- [ ] Przyciski są touch-friendly
- [ ] Dialogi są responsive

## ✅ Testy accessibility

- [ ] Wszystkie przyciski mają aria-label
- [ ] Wszystkie przyciski mają title (tooltip)
- [ ] Focus trap działa w dialogach
- [ ] Tab navigation działa poprawnie
- [ ] Screen reader friendly (semantyczny HTML)

## ✅ Testy edge cases

- [ ] Bardzo długa nazwa tematu (truncate)
- [ ] Wiele tematów (scrolling)
- [ ] Nazwa z emoji/znaki specjalne
- [ ] Nazwa z wieloma spacjami
- [ ] Network timeout

## ✅ Testy wydajności

- [ ] Optymistyczna aktualizacja działa (brak re-fetch)
- [ ] Re-renderowanie minimalne
- [ ] Animacje są płynne
- [ ] Brak memory leaks

## 🎯 Znane ograniczenia MVP

- Brak paginacji (przyjdzie później)
- Brak sortowania (przyjdzie później)
- Brak filtrowania (przyjdzie później)
- Brak sprawdzania czy temat ma pytania przed usunięciem (przyjdzie później)
- Używany DEFAULT_USER_ID (auth przyjdzie później)

## 📝 Uwagi do testowania manualnego

1. **Testuj na różnych przeglądarkach**: Chrome, Firefox, Safari
2. **Testuj na różnych urządzeniach**: Desktop, Tablet, Mobile
3. **Testuj w trybie offline**: Sprawdź obsługę błędów sieci
4. **Testuj z dev tools**: Sprawdź console na błędy
5. **Testuj accessibility**: Używaj tylko klawiatury do nawigacji

## ✅ Status implementacji

- ✅ Krok 1-3: Backend API (GET, POST, PUT, DELETE)
- ✅ Krok 4-6: Komponenty podstawowe i hook useTopics
- ✅ Krok 7-9: Formularze, dialogi i lista tematów
- ✅ Krok 10: Główny komponent TopicsView
- ✅ Krok 11: System toastów (Sonner)
- ✅ Krok 12: Responsywność i animacje
- ✅ Krok 13: Build sukces, gotowe do testowania

## 🚀 Gotowe do uruchomienia!

Aby przetestować widok:

```bash
# Development mode
npm run dev

# Przejdź do: http://localhost:4321/topics
```


