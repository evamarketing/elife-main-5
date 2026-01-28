import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminToken = req.headers.get("x-admin-token");
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: "Admin token required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate admin token
    const [payload] = adminToken.split(".");
    const decoded = JSON.parse(atob(payload));
    
    if (!decoded.exp || decoded.exp <= Date.now()) {
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminId = decoded.admin_id;
    const divisionId = decoded.division_id;

    if (!adminId || !divisionId) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const programId = url.searchParams.get("program_id");

    if (!programId) {
      return new Response(
        JSON.stringify({ error: "program_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the program belongs to the admin's division
    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("division_id")
      .eq("id", programId)
      .single();

    if (programError || !program) {
      return new Response(
        JSON.stringify({ error: "Program not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (program.division_id !== divisionId) {
      return new Response(
        JSON.stringify({ error: "Access denied: Program belongs to different division" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch registrations
    const { data: registrations, error: regError } = await supabase
      .from("program_registrations")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: false });

    if (regError) {
      console.error("Error fetching registrations:", regError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch registrations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ registrations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
