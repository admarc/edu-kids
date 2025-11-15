# REST API Plan

## 1. Resources
- Users (managed by Supabase Auth)
- Topics (`topics` table)
- Questions (`questions` table)
- Question Sets (`question_sets` table)
- Question Set Items (`question_set_items` join table)

## 2. Endpoints

### Authentication (handled by Supabase Auth)
- Registration: Supabase client handles sign-up via email/password.
- Login: Supabase client handles sign-in and returns JWT.
- Password management and account deletion: Supabase client endpoints.

### Topics
- **GET /api/topics**
  - Description: Retrieve paginated list of topics for the authenticated user.
  - Query Params: `page` (int), `limit` (int), `sort_by` ("name" | "created_at"), `order` ("asc" | "desc").
  - Response: `{ data: Topic[], pagination: { page, limit, total } }`.
- **POST /api/topics**
  - Description: Create a new topic.
  - Body: `{ name: string }` (1–100 chars).
  - Response: `{ id, user_id, name, created_at, updated_at }`.
- **GET /api/topics/:id**
  - Description: Retrieve a single topic by ID.
  - Response: `Topic`.
- **PUT /api/topics/:id**
  - Description: Update topic name.
  - Body: `{ name: string }`.
  - Response: Updated `Topic`.
- **DELETE /api/topics/:id**
  - Description: Delete a topic and cascade delete its questions.
  - Response: `{ success: true }`.

### Questions
- **POST /api/questions/generate**
  - Description: Generate a set of AI questions, save as `pending`.
  - Body: `{ age_group: number, topic_id: number, count: number (max 10) }`.
  - Response: `[{ id, content, status: "pending" }]`.
- **GET /api/questions**
  - Description: List questions created by the user.
  - Query Params: `page`, `limit`, `status` ("pending"|"accepted"|"rejected"), `age_group`, `topic_id`, `sort_by` ("created_at"), `order`.
  - Response: `{ data: Question[], pagination }`.
- **PATCH /api/questions/:id**
  - Description: Update question content or status.
  - Body: `{ content?: string, status?: "accepted"|"rejected" }`.
  - Response: Updated `Question`.
- **DELETE /api/questions/:id**
  - Description: Delete question.
  - Response: `{ success: true }`.

### Question Sets
- **GET /api/question-sets**
  - Description: List all question sets for the user.
  - Query Params: `page`, `limit`, `sort_by` ("created_at"), `order`.
  - Response: `{ data: QuestionSet[], pagination }`.
- **POST /api/question-sets**
  - Description: Create a new question set.
  - Body: `{ name: string }` (1–100 chars).
  - Response: Created `QuestionSet`.
- **GET /api/question-sets/:id**
  - Description: Retrieve a question set with its questions.
  - Response: `{ id, name, created_at, questions: Question[] }`.
- **DELETE /api/question-sets/:id**
  - Description: Delete a question set and its items.
  - Response: `{ success: true }`.
- **POST /api/question-sets/:id/questions**
  - Description: Add an accepted question to a set.
  - Body: `{ question_id: number }`.
  - Response: `{ set_id, question_id }`.
- **DELETE /api/question-sets/:id/questions/:question_id**
  - Description: Remove a question from a set.
  - Response: `{ success: true }`.
- **GET /api/question-sets/generate**
  - Description: Generate a new set of previously accepted questions by age group.
  - Query Params: `age_group`, `count` (max 10).
  - Response: `Question[]`.

## 3. Authentication & Authorization
- Mechanism: JWT via `Authorization: Bearer <token>` header.
- Authorization: Supabase RLS policies enforce `user_id = auth.uid()` on all records.
- All endpoints require authentication except Supabase-managed sign-up/in.

## 4. Validation & Business Logic
- `topics.name` and `question_sets.name`: length 1–100 chars.
- `questions.content`: non-empty text.
- `generate` endpoints: `count` <= 10.
- Status transitions: only `pending` → `accepted` or `rejected`.
- Pagination defaults: `page=1`, `limit=10`, `max limit=50`.
- Error handling: return `400 Bad Request` for validation errors, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.
