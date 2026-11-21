export function pickDailyReviews<T>(reviews: T[], seed: string, limit = 6): T[] {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let state = 2166136261;
  for (const char of `${dateKey}-${seed}`) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  state >>>= 0;

  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return reviews
    .map((review) => ({ review, order: random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map(({ review }) => review);
}
