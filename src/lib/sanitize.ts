/**
 * Sanitiza texto vindo da IA, removendo caracteres corrompidos
 * (ex: "激,type:", "激,title:") e ruído de labels.
 */
export function sanitizeText(text: unknown): string {
  if (!text || typeof text !== "string") return "";

  return text
    // Remove caracteres fora de ASCII básico + latim acentuado + pontuação comum
    .replace(/[^\x00-\x7FÀ-ÿ0-9a-zA-Z\s.,:;!?()\-'"&/]/g, "")
    // Remove labels parasitas tipo "type:" ou "title:" no meio do texto
    .replace(/\b(type|title)\s*:\s*/gi, "")
    // Normaliza espaços
    .replace(/\s+/g, " ")
    .trim();
}

export interface RawRecommendation {
  title?: string;
  type?: string;
  reason?: string;
  tags?: unknown;
  intensity?: number;
  posterUrl?: string;
  youtubeVideoId?: string;
}

export function sanitizeRecommendation<T extends RawRecommendation>(r: T) {
  const cleanTags = Array.isArray(r.tags)
    ? (r.tags as unknown[])
        .map((t) => sanitizeText(t))
        .filter((t) => t.length > 0)
    : [];

  const type = r.type === "series" ? "series" : "movie";

  return {
    ...r,
    title: sanitizeText(r.title),
    reason: sanitizeText(r.reason),
    tags: cleanTags,
    type,
    intensity: typeof r.intensity === "number" ? r.intensity : 3,
  };
}
