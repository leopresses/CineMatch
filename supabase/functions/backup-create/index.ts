import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    // Gather data
    const [prefsRes, watchlistRes, historyRes, sessionsRes] = await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("watchlist").select("*").eq("user_id", userId),
      supabase.from("recommendation_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("watch_sessions").select("*").eq("host_user_id", userId),
    ]);

    const snapshot = {
      user_preferences: prefsRes.data || null,
      watchlist: watchlistRes.data || [],
      recommendation_history: historyRes.data || [],
      watch_sessions: sessionsRes.data || [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("user_backups").insert({
      user_id: userId,
      snapshot,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ backup: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backup-create error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
