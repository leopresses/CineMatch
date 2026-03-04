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

    // Get latest backup
    const { data: backup, error: fetchErr } = await supabase
      .from("user_backups")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !backup) {
      return new Response(JSON.stringify({ error: "Nenhum backup encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = backup.snapshot as any;

    // Clear existing data
    await Promise.all([
      supabase.from("watchlist").delete().eq("user_id", userId),
      supabase.from("user_preferences").delete().eq("user_id", userId),
    ]);

    // Restore watchlist
    if (snapshot.watchlist?.length) {
      const items = snapshot.watchlist.map((w: any) => ({
        user_id: userId,
        title: w.title,
        item_type: w.item_type,
        poster_url: w.poster_url || null,
        external_id: w.external_id || null,
        watched: w.watched || false,
      }));
      await supabase.from("watchlist").insert(items);
    }

    // Restore preferences
    if (snapshot.user_preferences) {
      const p = snapshot.user_preferences;
      await supabase.from("user_preferences").insert({
        user_id: userId,
        favorite_genres: p.favorite_genres || [],
        disliked_genres: p.disliked_genres || [],
        streaming_services: p.streaming_services || [],
        content_limits: p.content_limits || {},
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backup-restore error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
