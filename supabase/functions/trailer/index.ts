import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: "title required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const searchQuery = `${title} trailer`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ youtube_video_id: null, search_url: searchUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try YouTube Data API
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        const videoId = data.items?.[0]?.id?.videoId;
        if (videoId) {
          return new Response(JSON.stringify({ youtube_video_id: videoId, search_url: searchUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        await res.text();
      }
    } catch {
      // fallback to search URL
    }

    return new Response(JSON.stringify({ youtube_video_id: null, search_url: searchUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trailer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
