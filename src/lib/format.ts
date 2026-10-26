export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return `\u20b9${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(rupees)}`;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
