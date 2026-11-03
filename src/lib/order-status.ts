export const ORDER_STATUS_OPTIONS = [
  { value: "NEW", label: "Ordered" },
  { value: "PACKED", label: "Packed" },
  { value: "DELIVERED", label: "Dispatched" },
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

export function normalizeOrderStatus(status: string): OrderStatusValue {
  if (status === "PACKED") return "PACKED";
  if (status === "DELIVERED") return "DELIVERED";
  return "NEW";
}

export function orderStatusLabel(status: string): string {
  const value = normalizeOrderStatus(status);
  return ORDER_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? "Ordered";
}

export function orderStatusStep(status: string): number {
  const value = normalizeOrderStatus(status);
  return ORDER_STATUS_OPTIONS.findIndex((option) => option.value === value);
}
