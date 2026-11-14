export type ShippingZone = 1 | 2 | 3 | 4;

export type ShippingLine = {
  packedWeightGrams: number;
  quantity: number;
};

export type ShippingQuote = {
  zone: ShippingZone;
  packedWeightGrams: number;
  boxWeightGrams: number;
  chargeableWeightGrams: number;
  baseShippingPaise: number;
  shippingDiscountPaise: number;
  shippingPaise: number;
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

function normalizeState(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STATE_ZONES: Record<string, ShippingZone> = {};

function addStates(zone: ShippingZone, states: string[]): void {
  for (const state of states) {
    STATE_ZONES[normalizeState(state)] = zone;
  }
}

addStates(1, ["Tamil Nadu", "Kerala", "Karnataka", "Puducherry"]);
addStates(2, [
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Gujarat",
  "Goa",
  "Madhya Pradesh",
  "Chhattisgarh",
  "Rajasthan",
  "Uttar Pradesh",
  "Uttarakhand",
  "Punjab",
  "Haryana",
  "Himachal Pradesh",
  "Bihar",
  "Jharkhand",
  "West Bengal",
  "Odisha",
  "Delhi",
  "Chandigarh",
  "Jammu and Kashmir",
  "Ladakh",
  "Dadra and Nagar Haveli and Daman and Diu",
]);
addStates(3, [
  "Assam",
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Sikkim",
]);
addStates(4, ["Lakshadweep", "Andaman and Nicobar Islands"]);

const STATE_ALIASES: Record<string, string> = {
  [normalizeState("Orissa")]: normalizeState("Odisha"),
  [normalizeState("Pondicherry")]: normalizeState("Puducherry"),
  [normalizeState("Uttaranchal")]: normalizeState("Uttarakhand"),
  [normalizeState("Jammu & Kashmir")]: normalizeState("Jammu and Kashmir"),
  [normalizeState("Andaman & Nicobar Islands")]: normalizeState(
    "Andaman and Nicobar Islands"
  ),
  [normalizeState("Daman and Diu")]: normalizeState(
    "Dadra and Nagar Haveli and Daman and Diu"
  ),
  [normalizeState("Dadra and Nagar Haveli")]: normalizeState(
    "Dadra and Nagar Haveli and Daman and Diu"
  ),
  [normalizeState("NCT of Delhi")]: normalizeState("Delhi"),
};

export function stateToZone(state: string | null | undefined): ShippingZone | null {
  if (!state) return null;
  const normalized = normalizeState(state);
  if (!normalized) return null;
  const alias = STATE_ALIASES[normalized];
  return STATE_ZONES[alias ?? normalized] ?? null;
}

const WEIGHT_BANDS = [
  500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000,
  10000, 15000, 20000, 25000, 30000,
];

const RATES_PAISE: Record<ShippingZone, number[]> = {
  1: [
    5000, 8300, 12100, 12100, 20000, 23700, 27600, 31500, 21700, 21700,
    24600, 24600, 30000, 43000, 55600, 55600, 81000,
  ],
  2: [
    7000, 13200, 19500, 19500, 32000, 38400, 44700, 51200, 31500, 31500,
    35900, 35900, 43900, 66500, 89000, 89000, 133800,
  ],
  3: [
    8000, 15500, 23000, 23000, 37700, 45100, 52500, 60000, 37000, 37000,
    42000, 42000, 51100, 76700, 102300, 102300, 153200,
  ],
  4: [
    9300, 18000, 35500, 35500, 44500, 53000, 62000, 70600, 41700, 41700,
    47700, 47700, 60000, 87000, 115000, 143000, 171000,
  ],
};

export function parseWeightGrams(value: string | null | undefined): number {
  if (!value) return 0;
  const text = value.trim().toLowerCase();

  const multiplied = text.match(
    /(\d+)\s*[x\u00d7]\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/
  );
  if (multiplied) {
    const count = Number(multiplied[1]);
    const unit = Number(multiplied[2]);
    const grams = multiplied[3] === "kg" ? unit * 1000 : unit;
    return Math.round(count * grams);
  }

  const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
  if (!match) return 0;
  const amount = Number(match[1]);
  return Math.round(match[2] === "kg" ? amount * 1000 : amount);
}

export function packedWeightForPackGrams(grams: number): number {
  if (!Number.isFinite(grams) || grams <= 0) return 0;

  if (grams <= 250) return Math.round(grams + 50);
  if (grams <= 400) return Math.round(grams + 30);
  if (grams <= 500) return Math.round(grams + 30);

  let remaining = Math.round(grams);
  let total = 0;
  while (remaining > 0) {
    const chunk = Math.min(500, remaining);
    total += packedWeightForPackGrams(chunk);
    remaining -= chunk;
  }
  return total;
}

export function packedWeightFromLabel(value: string | null | undefined): number {
  const grams = parseWeightGrams(value);
  if (!grams) return 0;

  const text = (value ?? "").toLowerCase();
  if (/\d+\s*[x\u00d7]\s*\d+(?:\.\d+)?\s*(kg|g)\b/.test(text)) {
    const multiplied = text.match(
      /(\d+)\s*[x\u00d7]\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/
    );
    if (multiplied) {
      const unit =
        multiplied[3] === "kg" ? Number(multiplied[2]) * 1000 : Number(multiplied[2]);
      return (
        Number(multiplied[1]) * packedWeightForPackGrams(Math.round(unit))
      );
    }
  }

  return packedWeightForPackGrams(grams);
}

export function boxWeightGrams(packedWeightGrams: number): number {
  if (packedWeightGrams <= 2000) return 0;
  if (packedWeightGrams <= 5000) return 280;
  if (packedWeightGrams <= 7000) return 500;
  return 800;
}

export function chargeableWeightGrams(finalWeightGrams: number): number {
  const weight = Math.max(0, Math.round(finalWeightGrams));
  return Math.max(500, Math.ceil(weight / 500) * 500);
}

export function baseShippingPaise(
  chargeableGrams: number,
  zone: ShippingZone
): number {
  const rates = RATES_PAISE[zone];
  for (let index = 0; index < WEIGHT_BANDS.length; index += 1) {
    if (chargeableGrams <= WEIGHT_BANDS[index]) return rates[index];
  }
  return rates[rates.length - 1];
}

export function shippingDiscountPaise(subtotalPaise: number): number {
  if (subtotalPaise < 49900) return 0;
  if (subtotalPaise <= 69899) return 1000;
  if (subtotalPaise <= 79899) return 1500;
  if (subtotalPaise <= 99899) return 2000;
  if (subtotalPaise <= 149999) return 3000;
  if (subtotalPaise <= 199999) return 5000;
  if (subtotalPaise <= 299999) return 12000;
  if (subtotalPaise <= 499999) return 18000;
  return 24000;
}

export function getShippingQuote(
  state: string | null | undefined,
  subtotalPaise: number,
  lines: ShippingLine[]
): ShippingQuote | null {
  const zone = stateToZone(state);
  if (!zone) return null;

  const packed = lines.reduce(
    (sum, line) =>
      sum +
      Math.max(0, Math.round(line.packedWeightGrams)) *
        Math.max(0, Math.round(line.quantity)),
    0
  );

  const box = boxWeightGrams(packed);
  const chargeable = chargeableWeightGrams(packed + box);
  const base = baseShippingPaise(chargeable, zone);
  const discount = Math.min(
    base,
    shippingDiscountPaise(Math.max(0, Math.round(subtotalPaise)))
  );

  return {
    zone,
    packedWeightGrams: packed,
    boxWeightGrams: box,
    chargeableWeightGrams: chargeable,
    baseShippingPaise: base,
    shippingDiscountPaise: discount,
    shippingPaise: Math.max(0, base - discount),
  };
}
