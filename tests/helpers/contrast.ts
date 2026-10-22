/** Shared colour helpers for contrast assertions (R11, R1.6, R18.7). */

export function parseRgb(value: string): { rgb: number[]; alpha: number } {
  const numbers = (value.match(/[\d.]+/g) ?? []).map(Number);
  return {
    rgb: numbers.slice(0, 3),
    alpha: numbers.length > 3 ? numbers[3] : 1,
  };
}

function luminance([r, g, b]: number[]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two `rgb(...)` strings. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(parseRgb(a).rgb);
  const lb = luminance(parseRgb(b).rgb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Flatten a translucent colour over an opaque backdrop (R24).
 *
 * Glassmorphic surfaces are semi-transparent, so their real colour depends on
 * what sits behind them. Contrast checks on a glass card have to composite
 * first or they measure a colour the user never sees.
 */
export function composite(over: string, under: string): string {
  const top = parseRgb(over);
  const bottom = parseRgb(under);
  const blended = top.rgb.map((channel, index) =>
    Math.round(channel * top.alpha + bottom.rgb[index] * (1 - top.alpha)),
  );
  return `rgb(${blended.join(", ")})`;
}
