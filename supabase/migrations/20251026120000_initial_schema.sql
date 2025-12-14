-- Migration: Initial Schema for Educational Kids App
-- Purpose: Create core tables for topics, questions, question sets, and their relationships
-- Affected tables: topics, questions, question_sets, question_set_items
-- Special considerations: Implements RLS for multi-tenant security, uses CASCADE deletes

-- Create enum type for question status lifecycle
create type question_status as enum ('pending', 'accepted', 'rejected');

-- Create topics table
-- Stores educational topics that users can create questions for
create table topics (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(100) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    
    -- Ensure topic name is between 1 and 100 characters
    constraint topics_name_length check (char_length(name) between 1 and 100)
);

-- Create questions table
-- Stores all questions with their status (pending, accepted, rejected)
create table questions (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    topic_id integer not null references topics(id) on delete cascade,
    age_group smallint not null,
    status question_status not null default 'pending',
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    
    -- Ensure question content is not empty
    constraint questions_content_not_empty check (char_length(content) > 0),
    -- Ensure age_group is reasonable (e.g., 3-18 years)
    constraint questions_age_group_valid check (age_group between 3 and 18)
);

-- Create question_sets table
-- Allows users to group accepted questions into named sets for easier organization
create table question_sets (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(100) not null,
    created_at timestamptz not null default now(),
    
    -- Ensure question set name is between 1 and 100 characters
    constraint question_sets_name_length check (char_length(name) between 1 and 100)
);

-- Create question_set_items join table
-- Links question sets to their constituent questions (many-to-many relationship)
create table question_set_items (
    set_id integer not null references question_sets(id) on delete cascade,
    question_id integer not null references questions(id) on delete cascade,
    
    -- Composite primary key prevents duplicate question-set associations
    primary key (set_id, question_id)
);

-- Create indexes for efficient querying
-- Index for finding questions by user
create index idx_questions_user_id on questions using btree (user_id);

-- Composite index for finding questions by user and status (common query pattern)
create index idx_questions_user_status on questions using btree (user_id, status);

-- Index for efficient joins in question_set_items
create index idx_question_set_items_set_id on question_set_items using btree (set_id);

-- Index for topic lookups by user
create index idx_topics_user_id on topics using btree (user_id);

-- Index for question set lookups by user
create index idx_question_sets_user_id on question_sets using btree (user_id);

-- Enable Row Level Security on all tables
-- This ensures users can only access their own data
alter table topics enable row level security;
alter table questions enable row level security;
alter table question_sets enable row level security;
alter table question_set_items enable row level security;

-- RLS Policies for topics table
-- Allow authenticated users to select their own topics
create policy "Users can view their own topics" on topics
    for select
    using (auth.uid() = user_id);

-- Allow authenticated users to insert their own topics
create policy "Users can create their own topics" on topics
    for insert
    with check (auth.uid() = user_id);

-- Allow authenticated users to update their own topics
create policy "Users can update their own topics" on topics
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own topics
create policy "Users can delete their own topics" on topics
    for delete
    using (auth.uid() = user_id);

-- RLS Policies for questions table
-- Allow authenticated users to select their own questions
create policy "Users can view their own questions" on questions
    for select
    using (auth.uid() = user_id);

-- Allow authenticated users to insert their own questions
create policy "Users can create their own questions" on questions
    for insert
    with check (auth.uid() = user_id);

-- Allow authenticated users to update their own questions
create policy "Users can update their own questions" on questions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own questions
create policy "Users can delete their own questions" on questions
    for delete
    using (auth.uid() = user_id);

-- RLS Policies for question_sets table
-- Allow authenticated users to select their own question sets
create policy "Users can view their own question sets" on question_sets
    for select
    using (auth.uid() = user_id);

-- Allow authenticated users to insert their own question sets
create policy "Users can create their own question sets" on question_sets
    for insert
    with check (auth.uid() = user_id);

-- Allow authenticated users to update their own question sets
create policy "Users can update their own question sets" on question_sets
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow authenticated users to delete their own question sets
create policy "Users can delete their own question sets" on question_sets
    for delete
    using (auth.uid() = user_id);

-- RLS Policies for question_set_items table
-- More complex policies needed since this table doesn't have user_id directly
-- Allow authenticated users to select question set items for their own sets
create policy "Users can view their own question set items" on question_set_items
    for select
    using (
        exists (
            select 1 from question_sets qs 
            where qs.id = question_set_items.set_id 
            and qs.user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert question set items for their own sets and questions
create policy "Users can create their own question set items" on question_set_items
    for insert
    with check (
        exists (
            select 1 from question_sets qs 
            where qs.id = question_set_items.set_id 
            and qs.user_id = auth.uid()
        )
        and exists (
            select 1 from questions q 
            where q.id = question_set_items.question_id 
            and q.user_id = auth.uid()
        )
    );

-- Allow authenticated users to delete question set items for their own sets
create policy "Users can delete their own question set items" on question_set_items
    for delete
    using (
        exists (
            select 1 from question_sets qs 
            where qs.id = question_set_items.set_id 
            and qs.user_id = auth.uid()
        )
    );

-- Add updated_at trigger function for automatic timestamp updates
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at timestamps
create trigger update_topics_updated_at
    before update on topics
    for each row
    execute function update_updated_at_column();

create trigger update_questions_updated_at
    before update on questions
    for each row
    execute function update_updated_at_column();
