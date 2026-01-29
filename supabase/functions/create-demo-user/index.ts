import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === "demo@logactually.com"
    );

    if (existingUser) {
      // User exists, just make sure profile is read-only
      await supabaseAdmin
        .from("profiles")
        .update({ is_read_only: true })
        .eq("id", existingUser.id);

      return new Response(
        JSON.stringify({ success: true, message: "Demo user already exists, ensured read-only", userId: existingUser.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the demo user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "demo@logactually.com",
      password: "demodemo",
      email_confirm: true,
    });

    if (createError) {
      throw createError;
    }

    // The handle_new_user trigger creates the profile automatically
    // Now update it to be read-only
    await supabaseAdmin
      .from("profiles")
      .update({ is_read_only: true })
      .eq("id", newUser.user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Demo user created", userId: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating demo user:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
