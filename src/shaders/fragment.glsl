precision highp float;

// ============================================================================
// UNIFORMS
// ============================================================================

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIterations;
uniform float u_escapeRadius;
uniform int u_fractalType;
uniform vec2 u_julia;
uniform float u_power;

// Coloring uniforms
uniform int u_colorScheme;
uniform int u_coloringMethod;
uniform float u_colorOffset;
uniform float u_colorScale;
uniform float u_time;
uniform float u_colorCycleSpeed;
uniform float u_glowIntensity;
uniform float u_posterize;
uniform float u_hueShift;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_stripeFrequency;
uniform float u_orbitTrapSize;

// ============================================================================
// CONSTANTS
// ============================================================================

#define PI 3.14159265359
#define EPSILON 1e-10
#define NEWTON_TOLERANCE 0.0001

// Newton's method roots for z^3 - 1 = 0
#define NEWTON_ROOT_1 vec2(1.0, 0.0)
#define NEWTON_ROOT_2 vec2(-0.5, 0.866025)
#define NEWTON_ROOT_3 vec2(-0.5, -0.866025)

// Fractal type constants
#define FRACTAL_MANDELBROT 0
#define FRACTAL_JULIA 1
#define FRACTAL_BURNING_SHIP 2
#define FRACTAL_TRICORN 3
#define FRACTAL_PHOENIX 4
#define FRACTAL_NEWTON 5

// ============================================================================
// COMPLEX NUMBER OPERATIONS
// ============================================================================

vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 complexDiv(vec2 a, vec2 b) {
  float denom = b.x * b.x + b.y * b.y;
  if (denom < EPSILON) return vec2(0.0);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
}

vec2 complexPow(vec2 z, float n) {
  float r = length(z);
  if (r < EPSILON) return vec2(0.0);
  float theta = atan(z.y, z.x);
  return pow(r, n) * vec2(cos(n * theta), sin(n * theta));
}

// ============================================================================
// COLOR CONVERSION
// ============================================================================

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// ============================================================================
// COLOR PALETTES
// ============================================================================

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 getColorScheme(float t, int scheme) {
  t = fract(t);

  if (scheme == 0) { // Classic
    return palette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
  } else if (scheme == 1) { // Smooth
    return palette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
  } else if (scheme == 2) { // Fire
    return palette(t, vec3(0.5, 0.2, 0.0), vec3(0.5, 0.4, 0.2), vec3(1.0, 0.8, 0.4), vec3(0.0, 0.1, 0.2));
  } else if (scheme == 3) { // Ocean
    return palette(t, vec3(0.0, 0.2, 0.4), vec3(0.0, 0.4, 0.5), vec3(0.0, 0.6, 0.8), vec3(0.0, 0.1, 0.3));
  } else if (scheme == 4) { // Rainbow
    return hsv2rgb(vec3(t, 0.85, 0.95));
  } else if (scheme == 5) { // Monochrome
    return vec3(t);
  } else if (scheme == 6) { // Psychedelic
    return palette(t, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.2, 0.25));
  } else if (scheme == 7) { // Neon
    vec3 col = palette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
    return pow(col, vec3(0.5)) * 1.5;
  } else { // Pastel
    return palette(t, vec3(0.8), vec3(0.2), vec3(1.0), vec3(0.0, 0.33, 0.67));
  }
}

// ============================================================================
// FRACTAL ITERATION FUNCTIONS
// ============================================================================

// Standard z^n + c iteration (Mandelbrot/Julia)
vec2 iterateMandelbrotJulia(vec2 z, vec2 c) {
  return complexPow(z, u_power) + c;
}

// Burning Ship: |z|^n + c
vec2 iterateBurningShip(vec2 z, vec2 c) {
  z = vec2(abs(z.x), abs(z.y));
  return complexPow(z, u_power) + c;
}

// Tricorn (Mandelbar): conj(z)^n + c
vec2 iterateTricorn(vec2 z, vec2 c) {
  z = vec2(z.x, -z.y); // Complex conjugate
  return complexPow(z, u_power) + c;
}

// Phoenix: z^n + c + p*prevZ
vec2 iteratePhoenix(vec2 z, vec2 c, vec2 prevZ) {
  return complexPow(z, u_power) + c + vec2(0.5667, 0.0) * prevZ;
}

// Newton's method for z^3 - 1 = 0
// Returns new z value; sets rootIndex if converged (0, 1, or 2), else -1
vec2 iterateNewton(vec2 z, out int rootIndex) {
  rootIndex = -1;

  vec2 z2 = complexMul(z, z);
  vec2 z3 = complexMul(z2, z);
  vec2 denom = 3.0 * z2;

  if (length(denom) < EPSILON) {
    return z;
  }

  vec2 newZ = z - complexDiv(z3 - vec2(1.0, 0.0), denom);

  // Check convergence to each root
  if (length(newZ - NEWTON_ROOT_1) < NEWTON_TOLERANCE) {
    rootIndex = 0;
  } else if (length(newZ - NEWTON_ROOT_2) < NEWTON_TOLERANCE) {
    rootIndex = 1;
  } else if (length(newZ - NEWTON_ROOT_3) < NEWTON_TOLERANCE) {
    rootIndex = 2;
  }

  return newZ;
}

// ============================================================================
// COLORING METHODS
// ============================================================================

float calcEscapeTimeColor(float iter, float maxIter) {
  return iter / maxIter;
}

float calcSmoothColor(float iter, float maxIter, vec2 z) {
  if (iter < maxIter) {
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(max(log_zn / log(2.0), EPSILON)) / log(max(u_power, 1.1));
    iter = iter + 1.0 - nu;
  }
  return iter / maxIter;
}

float calcOrbitTrapColor(float minDist) {
  return clamp(1.0 - minDist / u_orbitTrapSize, 0.0, 1.0);
}

float calcAngleColor(float totalAngle, float iter) {
  return totalAngle / (max(iter, 1.0) * PI * 2.0) + 0.5;
}

float calcStripeColor(float stripe, float iter) {
  return (stripe / max(iter, 1.0)) * 0.5 + 0.5;
}

float calcDomainColor(vec2 z) {
  return atan(z.y, z.x) / (2.0 * PI) + 0.5;
}

float calcNewtonColor(int rootIndex, float iter, float maxIter) {
  if (rootIndex >= 0) {
    float rootOffset = float(rootIndex) / 3.0;
    return rootOffset + iter / maxIter * 0.3;
  }
  return 0.0;
}

float calculateColorValue(
  float iter, float maxIter, vec2 z,
  float minDist, float totalAngle, float stripe,
  int rootIndex
) {
  // Newton uses special coloring
  if (u_fractalType == FRACTAL_NEWTON) {
    return calcNewtonColor(rootIndex, iter, maxIter);
  }

  // Standard coloring methods
  if (u_coloringMethod == 0) {
    return calcEscapeTimeColor(iter, maxIter);
  } else if (u_coloringMethod == 1) {
    return calcSmoothColor(iter, maxIter, z);
  } else if (u_coloringMethod == 2) {
    return calcOrbitTrapColor(minDist);
  } else if (u_coloringMethod == 3) {
    return calcAngleColor(totalAngle, iter);
  } else if (u_coloringMethod == 4) {
    return calcStripeColor(stripe, iter);
  } else {
    return calcDomainColor(z);
  }
}

// ============================================================================
// POST-PROCESSING EFFECTS
// ============================================================================

vec3 applyHueShift(vec3 color) {
  if (u_hueShift > 0.001) {
    vec3 hsv = rgb2hsv(color);
    hsv.x = fract(hsv.x + u_hueShift);
    return hsv2rgb(hsv);
  }
  return color;
}

vec3 applySaturation(vec3 color) {
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(gray), color, u_saturation);
}

vec3 applyGlow(vec3 color, float iter, float maxIter, float colorVal) {
  if (u_glowIntensity > 0.0 && u_fractalType != FRACTAL_NEWTON) {
    float glow = 1.0 - iter / maxIter;
    glow = pow(glow, 3.0) * u_glowIntensity;
    color += glow * getColorScheme(colorVal + 0.5, u_colorScheme);
  }
  return color;
}

vec3 applyPosterize(vec3 color) {
  if (u_posterize > 1.5) {
    return floor(color * u_posterize) / u_posterize;
  }
  return color;
}

vec3 postProcess(vec3 color, float iter, float maxIter, float colorVal) {
  color = applyHueShift(color);
  color = applySaturation(color);
  color *= u_brightness;
  color = applyGlow(color, iter, maxIter, colorVal);
  color = applyPosterize(color);
  return clamp(color, 0.0, 1.0);
}

// ============================================================================
// ORBIT STATISTICS
// ============================================================================

void updateOrbitStats(vec2 z, inout float minDist, inout float stripe, inout float totalAngle) {
  float dist = length(z);
  minDist = min(minDist, dist);

  if (dist > EPSILON) {
    float angle = atan(z.y, z.x);
    stripe += sin(angle * u_stripeFrequency);
    totalAngle += angle;
  }
}

// ============================================================================
// MAIN
// ============================================================================

void main() {
  // Convert screen coordinates to fractal space
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  vec2 c = uv / u_zoom + u_center;

  // Initialize z based on fractal type
  vec2 z;
  vec2 prevZ = vec2(0.0);

  if (u_fractalType == FRACTAL_JULIA) {
    z = c;
    c = u_julia;
  } else if (u_fractalType == FRACTAL_NEWTON) {
    z = c;
  } else {
    z = vec2(0.0);
  }

  // Iteration state
  float iter = 0.0;
  float maxIter = float(u_maxIterations);
  float minDist = 1e20;
  float totalAngle = 0.0;
  float stripe = 0.0;
  int rootIndex = -1;
  float escapeRadiusSq = u_escapeRadius * u_escapeRadius;

  // Main iteration loop
  for (int i = 0; i < 10000; i++) {
    if (i >= u_maxIterations) break;

    // Update orbit statistics for coloring
    updateOrbitStats(z, minDist, stripe, totalAngle);

    // Apply fractal-specific iteration
    if (u_fractalType == FRACTAL_NEWTON) {
      z = iterateNewton(z, rootIndex);
      if (rootIndex >= 0) break;
      iter += 1.0;
      continue;
    } else if (u_fractalType == FRACTAL_PHOENIX) {
      vec2 newZ = iteratePhoenix(z, c, prevZ);
      prevZ = z;
      z = newZ;
    } else if (u_fractalType == FRACTAL_TRICORN) {
      z = iterateTricorn(z, c);
    } else if (u_fractalType == FRACTAL_BURNING_SHIP) {
      z = iterateBurningShip(z, c);
    } else {
      z = iterateMandelbrotJulia(z, c);
    }

    // Check escape condition
    if (dot(z, z) > escapeRadiusSq) break;
    iter += 1.0;
  }

  // Calculate color value based on selected method
  float colorVal = calculateColorValue(iter, maxIter, z, minDist, totalAngle, stripe, rootIndex);
  colorVal = colorVal * u_colorScale + u_colorOffset + u_time * u_colorCycleSpeed;

  // Determine final color
  vec3 color;
  if (iter >= maxIter && u_fractalType != FRACTAL_NEWTON) {
    color = vec3(0.0); // Interior points are black
  } else {
    color = getColorScheme(colorVal, u_colorScheme);
  }

  // Apply post-processing effects
  color = postProcess(color, iter, maxIter, colorVal);

  gl_FragColor = vec4(color, 1.0);
}
