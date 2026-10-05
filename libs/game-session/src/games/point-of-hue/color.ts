// Color math for Point of Hue: hex <-> sRGB <-> CIELAB, and CIEDE2000 - the CIE's perceptual color
// difference, so "how close is this guess" matches how different the colors *look* rather than how
// far apart their RGB numbers are. Pure and dependency-free; color.spec.ts checks deltaE2000
// against Sharma, Wu & Dalal's published test data.

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface Lab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const isHexColor = (value: unknown): value is string => typeof value === 'string' && HEX_COLOR.test(value);

export const hexToRgb = (hex: string): Rgb => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const toHexByte = (value: number): string => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');

export const rgbToHex = ({ r, g, b }: Rgb): string => `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;

// h in degrees, s and l in 0..1.
export const hslToHex = (h: number, s: number, l: number): string => {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hue = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const [r1, g1, b1] =
    hue < 1 ? [chroma, x, 0] : hue < 2 ? [x, chroma, 0] : hue < 3 ? [0, chroma, x] : hue < 4 ? [0, x, chroma] : hue < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const m = l - chroma / 2;
  return rgbToHex({ r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 });
};

// sRGB companding undone - light-linear 0..1.
const toLinear = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

// D65 reference white, the sRGB standard's.
const WHITE = { X: 0.95047, Y: 1, Z: 1.08883 };
const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;
const f = (t: number): number => (t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116);

export const rgbToLab = ({ r, g, b }: Rgb): Lab => {
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
  const X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const Z = 0.0193339 * R + 0.119192 * G + 0.9503041 * B;
  const [fx, fy, fz] = [f(X / WHITE.X), f(Y / WHITE.Y), f(Z / WHITE.Z)];
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

export const hexToLab = (hex: string): Lab => rgbToLab(hexToRgb(hex));

const RAD = Math.PI / 180;
const POW25_7 = 25 ** 7;

const hueAngle = (b: number, a: number): number => (a === 0 && b === 0 ? 0 : (Math.atan2(b, a) / RAD + 360) % 360);

// CIEDE2000 with the standard parametric factors (kL = kC = kH = 1). Roughly: < 1 is
// imperceptible, ~2 is a just-noticeable difference, 50+ is a different color altogether.
export const deltaE2000 = (first: Lab, second: Lab): number => {
  const { L: L1, a: a1, b: b1 } = first;
  const { L: L2, a: a2, b: b2 } = second;

  const meanC = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = 0.5 * (1 - Math.sqrt(meanC ** 7 / (meanC ** 7 + POW25_7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p;
    dhp = Math.abs(diff) <= 180 ? diff : diff > 180 ? diff - 360 : diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * RAD);

  const meanLp = (L1 + L2) / 2;
  const meanCp = (C1p + C2p) / 2;
  let meanHp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) meanHp = (h1p + h2p) / 2;
    else meanHp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((meanHp - 30) * RAD) +
    0.24 * Math.cos(2 * meanHp * RAD) +
    0.32 * Math.cos((3 * meanHp + 6) * RAD) -
    0.2 * Math.cos((4 * meanHp - 63) * RAD);
  const dTheta = 30 * Math.exp(-(((meanHp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(meanCp ** 7 / (meanCp ** 7 + POW25_7));
  const Sl = 1 + (0.015 * (meanLp - 50) ** 2) / Math.sqrt(20 + (meanLp - 50) ** 2);
  const Sc = 1 + 0.045 * meanCp;
  const Sh = 1 + 0.015 * meanCp * T;
  const Rt = -Math.sin(2 * dTheta * RAD) * Rc;

  const lightness = dLp / Sl;
  const chroma = dCp / Sc;
  const hue = dHp / Sh;
  return Math.sqrt(lightness ** 2 + chroma ** 2 + hue ** 2 + Rt * chroma * hue);
};

export const hexDeltaE = (first: string, second: string): number => deltaE2000(hexToLab(first), hexToLab(second));
