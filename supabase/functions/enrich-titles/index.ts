import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    const { titles } = await req.json(); // [{ title, type }]

    if (!TMDB_API_KEY || !titles?.length) {
      // Return titles as-is without enrichment
      return new Response(JSON.stringify({ results: (titles || []).map((t: any) => ({ ...t, poster_url: null, year: null, tmdb_id: null })) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      titles.map(async (item: { title: string; type: string }) => {
        try {
          const mediaType = item.type === "series" ? "tv" : "movie";
          const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.title)}&language=pt-BR&page=1`;
          const res = await fetch(url);
          if (!res.ok) { await res.text(); return { ...item, poster_url: null, year: null, tmdb_id: null }; }
          const data = await res.json();
          const first = data.results?.[0];
          if (!first) return { ...item, poster_url: null, year: null, tmdb_id: null };
          const posterPath = first.poster_path;
          const date = first.release_date || first.first_air_date || "";
          return {
            ...item,
            poster_url: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null,
            year: date ? date.substring(0, 4) : null,
            tmdb_id: first.id?.toString() || null,
          };
        } catch {
          return { ...item, poster_url: null, year: null, tmdb_id: null };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-titles error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
