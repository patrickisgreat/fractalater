"use client";

import { FractalParams } from "@/types/fractal";

interface FractalLearnProps {
  params: FractalParams;
}

interface FractalInfo {
  name: string;
  formula: string;
  description: string;
  howItWorks: string[];
  keyInsights: string[];
  discoveredBy?: string;
  year?: string;
}

const fractalData: Record<string, FractalInfo> = {
  mandelbrot: {
    name: "Mandelbrot Set",
    formula: "z_{n+1} = z_n² + c",
    description:
      "The Mandelbrot set is the set of complex numbers c for which the iteration z_{n+1} = z_n² + c does not diverge to infinity when starting with z_0 = 0.",
    howItWorks: [
      "Start with z = 0 and a point c on the complex plane",
      "Repeatedly apply: z = z² + c",
      "If |z| stays bounded (< escape radius), c is IN the set (colored black)",
      "If |z| escapes to infinity, c is OUTSIDE the set (colored by iteration count)",
    ],
    keyInsights: [
      "The boundary has infinite complexity at every scale",
      "Small Mandelbrot copies appear throughout the boundary",
      "The area is approximately 1.50659...",
      "Connected: you can draw a path between any two points in the set",
    ],
    discoveredBy: "Benoît Mandelbrot",
    year: "1980",
  },
  julia: {
    name: "Julia Set",
    formula: "z_{n+1} = z_n² + c",
    description:
      "Julia sets use the same formula as Mandelbrot, but c is fixed and we vary the starting point z_0. Each point c produces a unique Julia set.",
    howItWorks: [
      "Fix a complex constant c (the Julia parameter)",
      "For each pixel, use that position as z_0",
      "Repeatedly apply: z = z² + c",
      "Color based on whether z escapes and how fast",
    ],
    keyInsights: [
      "Points INSIDE the Mandelbrot set give connected Julia sets",
      "Points OUTSIDE give disconnected 'dust' Julia sets",
      "Points on the boundary give the most intricate patterns",
      "Julia and Mandelbrot sets are deeply related: zoom into Mandelbrot and you'll see Julia-like shapes",
    ],
    discoveredBy: "Gaston Julia",
    year: "1918",
  },
  burningShip: {
    name: "Burning Ship",
    formula: "z_{n+1} = (|Re(z_n)| + i|Im(z_n)|)² + c",
    description:
      "A variant that takes the absolute value of the real and imaginary parts before squaring. This breaks the symmetry and creates the distinctive 'ship' shape.",
    howItWorks: [
      "Start with z = 0 and point c",
      "Take absolute values: z = |Re(z)| + i|Im(z)|",
      "Square and add c: z = z² + c",
      "The absolute value creates asymmetric, flame-like structures",
    ],
    keyInsights: [
      "Named for its resemblance to a burning ship on the sea",
      "The absolute value operation breaks complex conjugate symmetry",
      "Contains many smaller 'ships' at different scales",
      "Often rotated 180° for the classic ship appearance",
    ],
    discoveredBy: "Michael Michelitsch & Otto E. Rössler",
    year: "1992",
  },
  tricorn: {
    name: "Tricorn (Mandelbar)",
    formula: "z_{n+1} = z̄_n² + c",
    description:
      "Uses the complex conjugate of z before squaring. The conjugate flips the imaginary part's sign, creating three-fold rotational symmetry.",
    howItWorks: [
      "Start with z = 0 and point c",
      "Take conjugate: z̄ = Re(z) - i·Im(z)",
      "Square and add c: z = z̄² + c",
      "The conjugation creates the characteristic three-cornered shape",
    ],
    keyInsights: [
      "Also called the 'Mandelbar' set",
      "Has 3-fold rotational symmetry (hence 'tricorn')",
      "The conjugate operation reverses rotation direction each iteration",
      "Contains both Mandelbrot-like and unique structures",
    ],
    discoveredBy: "W.D. Crowe et al.",
    year: "1989",
  },
  phoenix: {
    name: "Phoenix Fractal",
    formula: "z_{n+1} = z_n² + Re(c) + Im(c)·z_{n-1}",
    description:
      "A fractal with 'memory' - each iteration depends on both the current z and the previous z value, creating flowing, organic patterns.",
    howItWorks: [
      "Keep track of both z and the previous z (z_prev)",
      "New z = z² + Re(c) + Im(c) × z_prev",
      "The 'memory' term creates flowing, connected structures",
      "Often produces more organic-looking fractals",
    ],
    keyInsights: [
      "The z_{n-1} term adds 'inertia' to the iteration",
      "Creates smoother, more connected patterns than standard Mandelbrot",
      "Named for its rising, flame-like appearance",
      "The memory effect can create spiral and wave patterns",
    ],
    discoveredBy: "Shigehiro Ushiki",
    year: "1988",
  },
  newton: {
    name: "Newton Fractal",
    formula: "z_{n+1} = z_n - f(z_n)/f'(z_n)",
    description:
      "Based on Newton's method for finding roots of equations. Colors show which root each starting point converges to and how quickly.",
    howItWorks: [
      "Uses Newton's root-finding method on f(z) = z³ - 1",
      "This equation has three roots (cube roots of 1)",
      "Each pixel is colored by which root it converges to",
      "Brightness shows convergence speed",
    ],
    keyInsights: [
      "Boundaries between root basins are fractally complex",
      "Points on boundaries may never converge",
      "Different polynomials create different Newton fractals",
      "Demonstrates chaos: tiny changes in start → different outcomes",
    ],
    discoveredBy: "Based on Isaac Newton's method (1669)",
    year: "Fractal visualization: ~1980s",
  },
};

const coloringMethodInfo: Record<string, { name: string; description: string }> = {
  escape: {
    name: "Escape Time",
    description: "Colors based on how many iterations before |z| exceeds the escape radius. Faster escape = different color.",
  },
  smooth: {
    name: "Smooth Iteration",
    description: "Uses logarithmic smoothing to eliminate color banding: n + 1 - log₂(log₂|z|). Creates continuous gradients.",
  },
  orbitTrap: {
    name: "Orbit Trap",
    description: "Colors based on how close the orbit comes to a 'trap' shape (point, line, or circle). Creates geometric patterns.",
  },
  angle: {
    name: "Angle Coloring",
    description: "Uses the angle (argument) of z when it escapes: atan2(Im(z), Re(z)). Reveals rotational structure.",
  },
  stripe: {
    name: "Stripe Average",
    description: "Averages sin(stripe_freq × angle) over all iterations. Creates detailed striping patterns in smooth areas.",
  },
  domain: {
    name: "Domain Coloring",
    description: "Colors the final z value directly: hue from angle, brightness from magnitude. Shows the complex function's behavior.",
  },
};

export default function FractalLearn({ params }: FractalLearnProps) {
  const info = fractalData[params.type] || fractalData.mandelbrot;
  const colorInfo = coloringMethodInfo[params.coloringMethod] || coloringMethodInfo.escape;

  return (
    <div className="space-y-4 text-sm">
      {/* Fractal Type Info */}
      <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
        <h4 className="text-blue-300 font-medium mb-2">{info.name}</h4>

        {/* Formula */}
        <div className="mb-3 p-2 bg-gray-900/50 rounded font-mono text-center text-blue-200">
          {info.formula}
        </div>

        <p className="text-gray-400 text-xs leading-relaxed mb-3">
          {info.description}
        </p>

        {info.discoveredBy && (
          <p className="text-xs text-gray-500">
            Discovered by {info.discoveredBy} ({info.year})
          </p>
        )}
      </div>

      {/* How It Works */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-gray-300 font-medium mb-2 text-xs uppercase tracking-wider">
          How It Works
        </h4>
        <ol className="text-xs text-gray-400 space-y-1.5">
          {info.howItWorks.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-400 font-mono">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Current Parameters */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-gray-300 font-medium mb-2 text-xs uppercase tracking-wider">
          Current Values
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="text-gray-500">Center:</div>
          <div className="text-gray-300">
            {params.centerX.toFixed(6)} {params.centerY >= 0 ? "+" : ""}{params.centerY.toFixed(6)}i
          </div>

          <div className="text-gray-500">Zoom:</div>
          <div className="text-gray-300">
            {params.zoom < 1000 ? params.zoom.toFixed(2) : params.zoom.toExponential(2)}×
          </div>

          <div className="text-gray-500">Iterations:</div>
          <div className="text-gray-300">{params.maxIterations}</div>

          <div className="text-gray-500">Escape radius:</div>
          <div className="text-gray-300">{params.escapeRadius}</div>

          {params.type === "julia" && (
            <>
              <div className="text-gray-500">Julia c:</div>
              <div className="text-gray-300">
                {params.juliaReal.toFixed(4)} {params.juliaImag >= 0 ? "+" : ""}{params.juliaImag.toFixed(4)}i
              </div>
            </>
          )}

          {params.power !== 2 && (
            <>
              <div className="text-gray-500">Power:</div>
              <div className="text-gray-300">{params.power.toFixed(2)}</div>
            </>
          )}
        </div>
      </div>

      {/* Coloring Method */}
      <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
        <h4 className="text-purple-300 font-medium mb-1 text-xs">
          Coloring: {colorInfo.name}
        </h4>
        <p className="text-xs text-gray-400">
          {colorInfo.description}
        </p>
      </div>

      {/* Key Insights */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-gray-300 font-medium mb-2 text-xs uppercase tracking-wider">
          Key Insights
        </h4>
        <ul className="text-xs text-gray-400 space-y-1.5">
          {info.keyInsights.map((insight, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-yellow-500">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mathematical Context */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-gray-300 font-medium mb-2 text-xs uppercase tracking-wider">
          The Math Behind It
        </h4>
        <div className="text-xs text-gray-400 space-y-2">
          <p>
            <span className="text-gray-300">Complex numbers:</span> Points on a 2D plane where
            x is the real part and y is the imaginary part (written as x + yi, where i² = -1).
          </p>
          <p>
            <span className="text-gray-300">Iteration:</span> Repeatedly applying a function to its
            own output. Small changes can lead to wildly different results—this is chaos theory.
          </p>
          <p>
            <span className="text-gray-300">Escape radius:</span> If |z| exceeds this value
            (currently {params.escapeRadius}), we know z will escape to infinity.
          </p>
          <p>
            <span className="text-gray-300">Self-similarity:</span> Fractals contain copies of
            themselves at smaller scales. Zoom in and you'll find similar patterns repeating infinitely.
          </p>
        </div>
      </div>

      {/* External Resources */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-gray-300 font-medium mb-2 text-xs uppercase tracking-wider">
          Learn More
        </h4>
        <div className="text-xs space-y-1">
          <a
            href="https://en.wikipedia.org/wiki/Mandelbrot_set"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-400 hover:text-blue-300 transition"
          >
            Wikipedia: Mandelbrot Set →
          </a>
          <a
            href="https://mathworld.wolfram.com/MandelbrotSet.html"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-400 hover:text-blue-300 transition"
          >
            Wolfram MathWorld →
          </a>
          <a
            href="https://www.youtube.com/watch?v=NGMRB4O922I"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-400 hover:text-blue-300 transition"
          >
            3Blue1Brown: Fractals Explained →
          </a>
        </div>
      </div>
    </div>
  );
}
