-- Migration: Disable RLS Policies
-- Purpose: Remove all Row Level Security policies from core tables
-- Affected tables: topics, questions, question_sets, question_set_items
-- Special considerations: This disables security policies but keeps RLS enabled on tables

-- Drop all RLS policies for topics table
drop policy if exists "Users can view their own topics" on topics;
drop policy if exists "Users can create their own topics" on topics;
drop policy if exists "Users can update their own topics" on topics;
drop policy if exists "Users can delete their own topics" on topics;

-- Drop all RLS policies for questions table
drop policy if exists "Users can view their own questions" on questions;
drop policy if exists "Users can create their own questions" on questions;
drop policy if exists "Users can update their own questions" on questions;
drop policy if exists "Users can delete their own questions" on questions;

-- Drop all RLS policies for question_sets table
drop policy if exists "Users can view their own question sets" on question_sets;
drop policy if exists "Users can create their own question sets" on question_sets;
drop policy if exists "Users can update their own question sets" on question_sets;
drop policy if exists "Users can delete their own question sets" on question_sets;

-- Drop all RLS policies for question_set_items table
drop policy if exists "Users can view their own question set items" on question_set_items;
drop policy if exists "Users can create their own question set items" on question_set_items;
drop policy if exists "Users can delete their own question set items" on question_set_items;
