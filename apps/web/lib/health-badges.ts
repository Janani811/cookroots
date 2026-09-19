export const HEALTH_BADGE_LABELS: Record<string, string> = {
  healthy: "🥗 Healthy",
  high_protein: "💪 High Protein",
  low_calorie: "🔥 Low Calorie",
  vegan: "🌱 Vegan",
  vegetarian: "🥦 Vegetarian",
};

export function healthBadgeLabel(badge: string): string {
  return HEALTH_BADGE_LABELS[badge] ?? badge;
}
