// Lightweight on-device recommendation engine based on user swipe history.
// No external AI required — pure scoring + ranking.

import type { Recommendation } from "@/components/RecommendationCard";

export type SwipeRecord = {
  title: string;
  liked: boolean;
  tags?: string[] | null;
  intensity?: number | null;
  created_at?: string;
};

export type Profile = {
  /** Tag → weighted score. Positive = liked, negative = disliked. */
  tags: Record<string, number>;
  /** Sum of (intensity * weight) for averaging. */
  intensity: number;
  /** Sum of weights — denominator for the intensity average. */
  total: number;
  /** Number of swipes seen (used for confidence/UX copy). */
  swipeCount: number;
};

/** Minimum swipes needed before personalization kicks in. */
export const MIN_SWIPES_FOR_PERSONALIZATION = 5;

/**
 * Build a behavioural profile from a chronological list of swipes.
 * Older entries get less weight than recent ones (recency boost).
 */
export function buildUserProfile(swipes: SwipeRecord[]): Profile {
  const profile: Profile = {
    tags: {},
    intensity: 0,
    total: 0,
    swipeCount: swipes.length,
  };

  const n = swipes.length || 1;

  swipes.forEach((s, index) => {
    const baseWeight = s.liked ? 1 : -1;
    // recency boost — most recent swipe ~2x weight, oldest ~1x
    const recencyBoost = 1 + index / n;
    const weight = baseWeight * recencyBoost;

    (s.tags || []).forEach((tag) => {
      if (!tag) return;
      profile.tags[tag] = (profile.tags[tag] || 0) + weight;
    });

    profile.intensity += (s.intensity || 3) * weight;
    profile.total += weight;
  });

  return profile;
}

/** Score a single recommendation against the profile. Higher = better match. */
export function scoreRecommendation(rec: Recommendation, profile: Profile): number {
  let score = 0;

  (rec.tags || []).forEach((tag) => {
    score += profile.tags[tag] || 0;
  });

  const avgIntensity = profile.total !== 0 ? profile.intensity / profile.total : 3;
  score -= Math.abs((rec.intensity || 3) - avgIntensity);

  return score;
}

export type RankedRecommendation = Recommendation & { score: number };

/** Rank recommendations by score (descending). */
export function rankRecommendations(
  recs: Recommendation[],
  profile: Profile
): RankedRecommendation[] {
  return recs
    .map((rec) => ({ ...rec, score: scoreRecommendation(rec, profile) }))
    .sort((a, b) => b.score - a.score);
}

/** Remove titles the user has already rejected. */
export function filterRejected(
  recs: Recommendation[],
  swipes: SwipeRecord[]
): Recommendation[] {
  const rejected = new Set(swipes.filter((s) => !s.liked).map((s) => s.title));
  return recs.filter((rec) => !rejected.has(rec.title));
}

/** Whether the profile has enough signal to personalize. */
export function isPersonalized(profile: Profile): boolean {
  return profile.swipeCount >= MIN_SWIPES_FOR_PERSONALIZATION;
}

/** UX copy helper. */
export function personalizationLabel(profile: Profile): string {
  if (profile.swipeCount === 0) return "Sugestões pra começar";
  if (!isPersonalized(profile)) return "Baseado no seu gosto";
  return "Recomendações personalizadas pra você";
}

/** Threshold above which a rec is considered a "high match" — UI badge. */
export function isHighMatch(score: number, profile: Profile): boolean {
  return isPersonalized(profile) && score >= 2;
}
