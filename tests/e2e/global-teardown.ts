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
  console.log("🧹 Starting global teardown...");

  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ SUPABASE_URL or SUPABASE_KEY not found in environment variables");
    console.error("   Skipping database cleanup");
    return;
  }

  if (!testUserEmail) {
    console.warn("⚠️  E2E_USERNAME not found - cannot identify test user topics");
    console.warn("   Skipping database cleanup");
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
      console.error("❌ Failed to authenticate test user:", authError?.message);
      console.error("   Skipping database cleanup");
      return;
    }

    const userId = authData.user.id;
    console.log(`✓ Authenticated as test user: ${testUserEmail}`);

    // Delete all topics for the test user
    const { data: deletedTopics, error: deleteError } = await supabase
      .from("topics")
      .delete()
      .eq("user_id", userId)
      .select();

    if (deleteError) {
      console.error("❌ Failed to delete test topics:", deleteError.message);
      return;
    }

    const deletedCount = deletedTopics?.length || 0;
    
    if (deletedCount > 0) {
      console.log(`✓ Deleted ${deletedCount} test topic(s)`);
    } else {
      console.log("✓ No test topics to clean up");
    }

    // Sign out
    await supabase.auth.signOut();
    console.log("✓ Signed out test user");

    console.log("✅ Global teardown completed successfully");
  } catch (error) {
    console.error("❌ Error during global teardown:", error);
    // Don't throw - we don't want teardown failures to fail the test suite
  }
}

export default globalTeardown;

