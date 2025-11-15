# Dokument wymagań produktu (PRD) - EduKids
## 1. Przegląd produktu
EduKids to webowa platforma umożliwiająca nauczycielom i rodzicom szybkie generowanie tematycznych zadań dla dzieci w oparciu o wiek i wybrany temat. Użytkownicy mogą rejestrować się, logować, zarządzać swoim kontem oraz generować zestawy pytań (do 10) wspierane przez AI. Każdą propozycję pytania można zaakceptować, odrzucić lub edytować, a zaakceptowane pytania są zapisywane w bazie danych wraz z możliwością przeglądu i filtrowania.
## 2. Problem użytkownika
Obecnie rodzice i nauczyciele poświęcają wiele czasu na ręczne wyszukiwanie zadań dostosowanych do wieku i zainteresowań dzieci. Nie mają gwarancji odpowiedniego poziomu trudności, a zadania często nie angażują najmłodszych. Brak centralnej platformy powoduje fragmentację materiałów i utrudnia szybką pracę z dziećmi.
## 3. Wymagania funkcjonalne
- Rejestracja i logowanie za pomocą e-maila i hasła.
- Zmiana hasła i usunięcie konta przez użytkownika.
- Generowanie zestawu pytań na podstawie wieku dziecka, wybranego tematu i liczby pytań (limit do 10).
- Akceptacja lub odrzucenie każdej wygenerowanej propozycji pytania.
- Ewentualna edycja pytania przed zatwierdzeniem.
- Przechowywanie zaakceptowanych pytań w bazie danych.
- Tworzenie, edycja i usuwanie tematów (CRUD).
- Przeglądanie zaakceptowanych pytań z możliwością filtrowania po wieku i temacie.
- Generowanie zestawu wcześniej zapisanych pytań dla wybranej grupy wiekowej.
- Obsługa błędów przy wywołaniach API AI z komunikatem o błędzie i możliwością ponowienia operacji.
## 4. Granice produktu
Zakres MVP:
- Webowa aplikacja dostępna przez przeglądarkę.
- Prompt templates przechowywane w kodzie.
- Prosty system kont użytkowników.
- Podstawowy pomiar akceptacji pytań.
Poza zakresem MVP:
- Współdzielenie zadań między użytkownikami.
- Aplikacje mobilne.
- System oceny trudności zadań.
- Zaawansowane mechanizmy cache’owania.
- Szczegółowa analityka poza liczbą akceptacji i odrzuceń.
- Polityka prywatności i RODO.
## 5. Historyjki użytkowników
- ID: US-001
  Tytuł: Rejestracja użytkownika
  Opis: Jako nowy użytkownik chcę zarejestrować się za pomocą e-maila i hasła, aby uzyskać dostęp do platformy.
  Kryteria akceptacji:
  - Formularz rejestracji z walidacją e-mail i hasła.
  - Po udanej rejestracji konto jest dostępne w systemie.

- ID: US-002
  Tytuł: Logowanie użytkownika
  Opis: Jako zarejestrowany użytkownik chcę zalogować się e-mailem i hasłem, aby korzystać z funkcji platformy.
  Kryteria akceptacji:
  - Formularz logowania z walidacją danych.
  - Dostęp do chronionych zasobów po zalogowaniu.
  - Obsługa błędnych danych z komunikatem o błędzie.

- ID: US-003
  Tytuł: Zmiana hasła
  Opis: Jako zalogowany użytkownik chcę zmienić swoje hasło, aby zabezpieczyć konto.
  Kryteria akceptacji:
  - Formularz zmiany hasła z walidacją starego i nowego hasła.
  - Komunikat o sukcesie po zmianie.

- ID: US-004
  Tytuł: Usunięcie konta
  Opis: Jako użytkownik chcę móc usunąć swoje konto, aby usunąć swoje dane z platformy.
  Kryteria akceptacji:
  - Opcja usunięcia konta z potwierdzeniem.
  - Usunięcie danych użytkownika z bazy.

- ID: US-005
  Tytuł: Generowanie zestawu pytań
  Opis: Jako użytkownik chcę wygenerować zestaw pytań, podając wiek, temat i liczbę pytań (max 10), aby otrzymać odpowiednie zadania.
  Kryteria akceptacji:
  - Formularz z polami: wiek, temat, liczba pytań.
  - Po kliknięciu "Generuj" wyświetlany jest zestaw pytań.
  - Obsługa błędów (np. liczba >10).

- ID: US-006
  Tytuł: Akceptacja pytań
  Opis: Jako użytkownik chcę akceptować wygenerowane pytania, aby zachować tylko te odpowiednie.
  Kryteria akceptacji:
  - Przycisk "Zatwierdź" przy każdym pytaniu.
  - Pytanie przenoszone do listy zaakceptowanych.

- ID: US-007
  Tytuł: Odrzucenie pytań
  Opis: Jako użytkownik chcę odrzucać pytania, aby wykluczyć nieodpowiednie.
  Kryteria akceptacji:
  - Przycisk "Odrzuć" przy każdym pytaniu.
  - Pytanie usuwane z listy propozycji.

- ID: US-008
  Tytuł: CRUD tematów
  Opis: Jako użytkownik chcę tworzyć, edytować i usuwać tematy, aby zarządzać dostępnymi zagadnieniami.
  Kryteria akceptacji:
  - Interfejs do dodawania nowego tematu.
  - Możliwość edycji i usuwania istniejących.

- ID: US-009
  Tytuł: Przegląd zaakceptowanych pytań
  Opis: Jako użytkownik chcę przeglądać zapisane pytania, aby łatwo odnaleźć materiały.
  Kryteria akceptacji:
  - Lista zaakceptowanych pytań.
  - Filtrowanie po wieku i temacie.

- ID: US-010
  Tytuł: Edycja zaakceptowanych pytań
  Opis: Jako użytkownik chcę edytować zapisane pytania, aby poprawić treść.
  Kryteria akceptacji:
  - Przycisk "Edytuj" przy każdym pytaniu.
  - Możliwość zapisu zmian.

- ID: US-011
  Tytuł: Usuwanie zaakceptowanych pytań
  Opis: Jako użytkownik chcę usuwać zapisane pytania, aby utrzymywać bibliotekę.
  Kryteria akceptacji:
  - Przycisk "Usuń" przy pytaniu.
  - Pytanie usuwane z bazy.

- ID: US-012
  Tytuł: Generowanie zestawu zapisanych zadań
  Opis: Jako użytkownik chcę wygenerować zestaw wcześniej zaakceptowanych pytań dla danej grupy wiekowej.
  Kryteria akceptacji:
  - Wybór grupy wiekowej.
  - Generowanie zestawu z zaakceptowanych pytań.

## 6. Metryki sukcesu
- 50% wygenerowanych pytań zaakceptowanych przez użytkowników.
- Monitorowanie liczby akceptacji i odrzuceń (metryki podstawowe).
- Liczba aktywnych użytkowników generujących zestawy.
- Czas od żądania do wygenerowania zestawu pytań.
