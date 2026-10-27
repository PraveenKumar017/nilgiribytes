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

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}/${date.getFullYear()}`;
}
