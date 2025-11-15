-- Migration: Disable RLS for MVP
-- Purpose: Disable Row Level Security entirely for MVP phase (no authentication yet)
-- Affected tables: topics, questions, question_sets, question_set_items

-- Disable Row Level Security on all tables
alter table topics disable row level security;
alter table questions disable row level security;
alter table question_sets disable row level security;
alter table question_set_items disable row level security;

