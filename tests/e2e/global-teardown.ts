import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Global Teardown for Playwright E2E Tests
 *
 * This function runs once after all tests have completed.
 * It cleans up test topics from the database to prevent pollution.
 *
 * Uses environment variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_KEY: Supabase anon/service key
 * - E2E_USERNAME: Test user email (to identify test topics)
 */
async function globalTeardown() {
  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;

  if (!supabaseUrl || !supabaseKey) {
    return;
  }

  if (!testUserEmail) {
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Get test user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: process.env.E2E_PASSWORD || "",
    });

    if (authError || !authData.user) {
      return;
    }

    const userId = authData.user.id;

    // Delete all topics for the test user
    const { error: deleteError } = await supabase.from("topics").delete().eq("user_id", userId);

    if (deleteError) {
      return;
    }

    // Sign out
    await supabase.auth.signOut();
  } catch {
    // Don't throw - we don't want teardown failures to fail the test suite
  }
}

export default globalTeardown;
