export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: boolean | string | number | undefined | null | boolean }
  | ClassValue[];

function normalizeClassValue(value: ClassValue): string[] {
  if (value === undefined || value === null || value === false) {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }

  if (Array.isArray(value)) {
    return value.flatMap((child) => normalizeClassValue(child));
  }

  return [];
}

export function cn(...inputs: ClassValue[]) {
  return inputs.flatMap((value) => normalizeClassValue(value)).join(" ");
}
