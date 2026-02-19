type RGBColor = {
  r: number;
  g: number;
  b: number;
};

const toChannel = (channel: string) => Number.parseInt(channel, 16);

export const parseHexColor = (value: string) => {
  const normalized = value.trim();
  if (!normalized.startsWith("#")) return null;

  const hex = normalized.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;

  if (hex.length === 3) {
    const expanded = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    return {
      r: toChannel(expanded.slice(0, 2)),
      g: toChannel(expanded.slice(2, 4)),
      b: toChannel(expanded.slice(4, 6)),
    };
  }

  if (hex.length !== 6) return null;

  return {
    r: toChannel(hex.slice(0, 2)),
    g: toChannel(hex.slice(2, 4)),
    b: toChannel(hex.slice(4, 6)),
  };
};

const parseRgbColor = (value: string) => {
  const match = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
  );

  if (!match) return null;

  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
};

export const parseRGB = (value: string): RGBColor => {
  return (
    parseRgbColor(value) ??
    parseHexColor(value) ?? {
      r: 0,
      g: 0,
      b: 0,
    }
  );
};

export const withOpacity = (value: string, alpha: number) => {
  const { r, g, b } = parseRGB(value);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export type { RGBColor };
