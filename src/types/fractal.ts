export type FractalType = "mandelbrot" | "julia" | "burningship" | "tricorn" | "phoenix" | "newton";

export type ColorScheme = "classic" | "smooth" | "fire" | "ocean" | "rainbow" | "monochrome" | "psychedelic" | "neon" | "pastel";

export type ColoringMethod = "escape" | "smooth" | "orbit" | "angle" | "stripe" | "domain";

export interface FractalParams {
  type: FractalType;
  centerX: number;
  centerY: number;
  zoom: number;
  maxIterations: number;
  escapeRadius: number;

  // Julia parameters
  juliaReal: number;
  juliaImag: number;

  // Power parameter (z^power instead of z^2)
  power: number;

  // Coloring
  colorScheme: ColorScheme;
  coloringMethod: ColoringMethod;
  colorOffset: number;
  colorScale: number;

  // Psychedelic effects
  colorCycleSpeed: number;
  glowIntensity: number;
  posterize: number;
  hueShift: number;
  saturation: number;
  brightness: number;

  // Stripe/pattern effects
  stripeFrequency: number;
  orbitTrapSize: number;

  // Animation toggles
  animateJulia: boolean;
  juliaAnimSpeed: number;

  // Auto-animate system
  autoZoom: boolean;
  autoZoomSpeed: number;        // positive = zoom in, negative = zoom out
  autoRotate: boolean;          // rotate around current center
  autoRotateSpeed: number;
  autoHueShift: boolean;        // cycle through hues
  autoHueSpeed: number;
  autoPower: boolean;           // cycle power value
  autoPowerSpeed: number;
  globalAnimSpeed: number;      // master speed multiplier
}

export const DEFAULT_FRACTAL_PARAMS: FractalParams = {
  type: "mandelbrot",
  centerX: -0.5,
  centerY: 0,
  zoom: 1,
  maxIterations: 100,
  escapeRadius: 4,
  juliaReal: -0.7,
  juliaImag: 0.27015,
  power: 2,
  colorScheme: "classic",
  coloringMethod: "smooth",
  colorOffset: 0,
  colorScale: 1,
  colorCycleSpeed: 0,
  glowIntensity: 0,
  posterize: 0,
  hueShift: 0,
  saturation: 1,
  brightness: 1,
  stripeFrequency: 10,
  orbitTrapSize: 0.5,
  animateJulia: false,
  juliaAnimSpeed: 1,
  autoZoom: false,
  autoZoomSpeed: 0.5,
  autoRotate: false,
  autoRotateSpeed: 0.2,
  autoHueShift: false,
  autoHueSpeed: 0.1,
  autoPower: false,
  autoPowerSpeed: 0.3,
  globalAnimSpeed: 1,
};

export interface SavedFractal {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  params: FractalParams;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
