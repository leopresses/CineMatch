import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function cleanTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, "") // remove (2020) etc
    .replace(/[:\-–—].*/g, "") // remove subtítulos depois de : - – —
    .trim();
}

async function tmdbSearch(apiKey: string, mediaType: "movie" | "tv", query: string) {
  if (!query) return [];
  const url = `https://api.themoviedb.org/3/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const res = await fetch(url);
  if (!res.ok) {
    await res.text();
    return [];
  }
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function tmdbMultiSearch(apiKey: string, query: string) {
  if (!query) return [];
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const res = await fetch(url);
  if (!res.ok) {
    await res.text();
    return [];
  }
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
    const { titles } = await req.json(); // [{ title, type }]

    if (!TMDB_API_KEY || !titles?.length) {
      return new Response(
        JSON.stringify({
          results: (titles || []).map((t: { title: string; type: string }) => ({
            ...t,
            poster_url: null,
            year: null,
            tmdb_id: null,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.all(
      titles.map(async (item: { title: string; type: string }) => {
        try {
          const desiredType: "movie" | "tv" = item.type === "series" ? "tv" : "movie";
          const original = (item.title || "").trim();

          // 1) Busca direta no tipo desejado
          let candidates = await tmdbSearch(TMDB_API_KEY, desiredType, original);

          // 2) Fallback: busca com título limpo (sem subtítulos / parênteses)
          if (candidates.length === 0) {
            const cleaned = cleanTitle(original);
            if (cleaned && cleaned !== original) {
              candidates = await tmdbSearch(TMDB_API_KEY, desiredType, cleaned);
            }
          }

          // 3) Fallback: busca multi (filme + tv + pessoa)
          if (candidates.length === 0) {
            const multi = await tmdbMultiSearch(TMDB_API_KEY, original);
            candidates = multi.filter(
              (r: { media_type?: string }) =>
                r.media_type === "movie" || r.media_type === "tv"
            );
          }

          if (candidates.length === 0) {
            console.log("TMDB MISS:", original);
            return { ...item, poster_url: null, year: null, tmdb_id: null };
          }

          // Prioriza: tipo correto -> tem poster -> primeiro
          const best =
            candidates.find(
              (r: { media_type?: string; poster_path?: string }) =>
                (r.media_type === desiredType || !r.media_type) && r.poster_path
            ) ||
            candidates.find((r: { poster_path?: string }) => r.poster_path) ||
            candidates[0];

          const posterPath = best?.poster_path;
          const date = best?.release_date || best?.first_air_date || "";

          return {
            ...item,
            poster_url: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null,
            year: date ? date.substring(0, 4) : null,
            tmdb_id: best?.id?.toString() || null,
          };
        } catch (err) {
          console.error("TMDB error for", item.title, err);
          return { ...item, poster_url: null, year: null, tmdb_id: null };
        }
      })
    );

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-titles error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
