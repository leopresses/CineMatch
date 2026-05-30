const TMDB_API_KEY = "4a9e3946dd5dfb9768a17e95580badb4";
const BASE_URL = "https://api.themoviedb.org/3";

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  vote_average: number;
  media_type?: "movie" | "tv";
}

export const fetchTMDB = async (endpoint: string, params: Record<string, string | number | boolean> = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY);
  url.searchParams.append("language", "pt-BR");
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Erro na API do TMDB");
  return response.json();
};

export const discoverTitles = async (
  type: "movie" | "tv", 
  genres?: string, 
  page: number = 1,
  extraParams?: Record<string, string | number>
) => {
  const endpoint = `/discover/${type}`;
  let params: Record<string, string | number> = {
    sort_by: "popularity.desc",
    page,
    "vote_count.gte": 100, // Evitar filmes muito obscuros
  };
  if (genres) {
    params.with_genres = genres;
  }
  if (extraParams) {
    params = { ...params, ...extraParams };
  }
  
  const data = await fetchTMDB(endpoint, params);
  return data.results.map((r: TMDBResult) => ({ ...r, media_type: type }));
};

export const getWatchProviders = async (id: number, type: "movie" | "tv") => {
  const data = await fetchTMDB(`/${type}/${id}/watch/providers`);
  return data.results?.BR?.flatrate || [];
};

export const getTrailer = async (id: number, type: "movie" | "tv") => {
  const data = await fetchTMDB(`/${type}/${id}/videos`);
  const trailer = data.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

export const searchTitles = async (query: string) => {
  const data = await fetchTMDB("/search/multi", { query });
  return data.results.filter((r: TMDBResult) => r.media_type === "movie" || r.media_type === "tv");
};

export const getTrending = async () => {
  const data = await fetchTMDB("/trending/all/day");
  return data.results.filter((r: TMDBResult) => r.media_type === "movie" || r.media_type === "tv");
};

export const getDetails = async (id: number, type: "movie" | "tv") => {
  return await fetchTMDB(`/${type}/${id}`);
};

export const getCredits = async (id: number, type: "movie" | "tv") => {
  return await fetchTMDB(`/${type}/${id}/credits`);
};

export const getSimilar = async (id: number, type: "movie" | "tv") => {
  const data = await fetchTMDB(`/${type}/${id}/similar`);
  return data.results.map((r: TMDBResult) => ({ ...r, media_type: type }));
};

export const getPersonDetails = async (personId: number) => {
  return await fetchTMDB(`/person/${personId}`);
};

export const getPersonCredits = async (personId: number) => {
  const data = await fetchTMDB(`/person/${personId}/combined_credits`);
  return data.cast?.sort((a: any, b: any) => b.popularity - a.popularity) || [];
};

// Mapeamento simplificado de gêneros do TMDB
export const genreMap: Record<string, number> = {
  "Ação": 28, "Aventura": 12, "Animação": 16, "Comédia": 35,
  "Crime": 80, "Documentário": 99, "Drama": 18, "Família": 10751,
  "Fantasia": 14, "Ficção Científica": 878, "Horror": 27, "Terror": 27,
  "Mistério": 9648, "Romance": 10749, "Suspense": 53, "Western": 37
};

export const providerMap: Record<string, number> = {
  "Netflix": 8,
  "Prime Video": 119,
  "Disney+": 337,
  "HBO Max": 1899,
  "Apple TV+": 2,
  "Globoplay": 307,
  "Star+": 337,
  "Paramount+": 531,
  "Crunchyroll": 283,
  "YouTube Premium": 188
};
