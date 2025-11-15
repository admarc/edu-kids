<conversation_summary>
<decisions>
1. Use SERIAL primary keys for `users`, `topics`, and `questions`.  
2. Add `created_at` and `updated_at` timestamps to `topics` and `questions`.  
3. Represent question status with a PostgreSQL enum (`pending`, `accepted`, `rejected`).  
4. Store all questions in a single `questions` table with a status flag for accepted/rejected.  
5. Enforce length constraints: topic name 1–100 chars, question content non-empty.  
6. Cascade delete topics and questions when a user is deleted (`ON DELETE CASCADE`).  
7. Add BTREE indexes on `questions(user_id)` and composite `(user_id, status)`.  
8. No additional views or materialized views at MVP.  
9. Rely on Supabase’s built-in user handling; no custom column encryption.  
10. Implement RLS policies using an `authenticated` role and `user_id = auth.uid()`.  
11. Create `question_sets` table to group accepted questions (`id`, `user_id`, `name`, `created_at`).  
12. Create `question_set_items` join table (`set_id`, `question_id`) linking sets to questions.  
</decisions>

<matched_recommendations>
1. Use SERIAL primary keys for consistency and simplicity.  
2. Add timestamp columns (`created_at`, `updated_at`) for auditability.  
3. Define a `question_status` enum for question lifecycle.  
4. Apply CHECK constraints on string lengths.  
5. Use `ON DELETE CASCADE` to maintain referential integrity.  
6. Create BTREE indexes for efficient querying by user and status.  
7. Plan RLS policies with `user_id = auth.uid()` for row-level security.  
</matched_recommendations>

<database_planning_summary>
Entities:
- `users` (managed by Supabase)  
- `topics`  
  • id SERIAL PK  
  • user_id FK → users(id)  
  • name VARCHAR(1–100)  
  • created_at TIMESTAMPTZ DEFAULT now()  
  • updated_at TIMESTAMPTZ  

- `questions`  
  • id SERIAL PK  
  • user_id FK → users(id)  
  • topic_id FK → topics(id)  
  • age_group SMALLINT  
  • status question_status ENUM('pending','accepted','rejected')  
  • content TEXT  
  • created_at TIMESTAMPTZ DEFAULT now()  
  • updated_at TIMESTAMPTZ  

- `question_sets`  
  • id SERIAL PK  
  • user_id FK → users(id)  
  • name VARCHAR(1–100)  
  • created_at TIMESTAMPTZ DEFAULT now()  

- `question_set_items`  
  • set_id FK → question_sets(id)  
  • question_id FK → questions(id)  
  • PRIMARY KEY (set_id, question_id)  

Relationships:
- One `user` → many `topics`  
- One `topic` → many `questions`  
- One `user` → many `questions`  
- One `user` → many `question_sets`  
- One `question_set` → many `questions` via `question_set_items`  

Indexes:
- BTREE on `questions(user_id)`  
- BTREE on `questions(user_id, status)`  
- BTREE on `question_set_items(set_id)`  

Constraints & Integrity:
- CHECK length(name) BETWEEN 1 AND 100 on `topics.name` and `question_sets.name`  
- CHECK char_length(content) > 0 on `questions.content`  
- ENUM `question_status` on `questions.status`  
- ON DELETE CASCADE from `users` → `topics`, `questions`, `question_sets`  

Security & RLS:
- Role: `authenticated`  
- RLS policies on `topics`, `questions`, `question_sets`, `question_set_items`:  
  • USING and WITH CHECK `user_id = auth.uid()`  
  • For `question_set_items`, ensure parent set’s `user_id = auth.uid()`  
</database_planning_summary>

<unresolved_issues>
None at this stage; the schema covers all MVP requirements including question sets.
</unresolved_issues>
</conversation_summary>