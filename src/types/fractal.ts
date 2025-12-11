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

  // Performance
  performanceMode: boolean;     // reduce resolution for smoother animation
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
  autoZoomSpeed: 0.02,
  autoRotate: false,
  autoRotateSpeed: 0.02,
  autoHueShift: false,
  autoHueSpeed: 0.02,
  autoPower: false,
  autoPowerSpeed: 0.02,
  globalAnimSpeed: 1,
  performanceMode: false,
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

// Interesting deep zoom coordinates for Mandelbrot set
export interface DeepZoomTarget {
  name: string;
  centerX: number;
  centerY: number;
  description: string;
}

export const DEEP_ZOOM_TARGETS: DeepZoomTarget[] = [
  {
    name: "Seahorse Valley",
    centerX: -0.7463,
    centerY: 0.1102,
    description: "Famous seahorse-shaped spiral formations",
  },
  {
    name: "Elephant Valley",
    centerX: 0.275,
    centerY: 0.0,
    description: "Elephant trunk-like bulbs",
  },
  {
    name: "Mini Mandelbrot",
    centerX: -1.768778833,
    centerY: -0.001738996,
    description: "A tiny copy of the full set",
  },
  {
    name: "Spiral Galaxy",
    centerX: -0.745428,
    centerY: 0.113009,
    description: "Beautiful spiral patterns",
  },
  {
    name: "Lightning",
    centerX: -0.170337,
    centerY: -1.0660699,
    description: "Electric branch-like structures",
  },
  {
    name: "Tendrils",
    centerX: -0.235125,
    centerY: 0.827215,
    description: "Delicate tendril formations",
  },
  {
    name: "Double Spiral",
    centerX: -0.7436439,
    centerY: 0.1318259,
    description: "Twin spiral structures",
  },
  {
    name: "Starfish",
    centerX: -0.3750001200618655,
    centerY: -0.6592316094481254,
    description: "Five-armed starfish pattern",
  },
  {
    name: "Deep Mini",
    centerX: -1.9854300851907,
    centerY: -0.00000013493,
    description: "Very deep mini Mandelbrot",
  },
  {
    name: "Dendrite",
    centerX: -0.1011,
    centerY: 0.9563,
    description: "Tree-like branching patterns",
  },
];
