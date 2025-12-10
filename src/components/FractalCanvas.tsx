"use client";

import { useEffect, useRef, useCallback } from "react";
import { FractalParams } from "@/types/fractal";

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

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

  #define PI 3.14159265359

  // Complex number operations
  vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }

  vec2 complexDiv(vec2 a, vec2 b) {
    float denom = b.x * b.x + b.y * b.y;
    return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
  }

  vec2 complexPow(vec2 z, float n) {
    float r = length(z);
    float theta = atan(z.y, z.x);
    return pow(r, n) * vec2(cos(n * theta), sin(n * theta));
  }

  // HSV to RGB conversion
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // RGB to HSV
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  // Palette function
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

  void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
    vec2 c = uv / u_zoom + u_center;
    vec2 z;
    vec2 prevZ = vec2(0.0);

    // Set initial z and c based on fractal type
    if (u_fractalType == 1) { // Julia
      z = c;
      c = u_julia;
    } else {
      z = vec2(0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_maxIterations);
    float minDist = 1e20; // For orbit trap
    float totalAngle = 0.0; // For angle coloring
    float stripe = 0.0; // For stripe coloring

    for (int i = 0; i < 10000; i++) {
      if (i >= u_maxIterations) break;

      float x = z.x;
      float y = z.y;

      // Orbit trap - track minimum distance to origin
      float dist = length(z);
      minDist = min(minDist, dist);

      // Stripe average
      stripe += sin(atan(z.y, z.x) * u_stripeFrequency);

      // Angle accumulation for domain coloring
      totalAngle += atan(z.y, z.x);

      // Apply fractal formula based on type
      if (u_fractalType == 2) { // Burning Ship
        x = abs(x);
        y = abs(y);
      } else if (u_fractalType == 3) { // Tricorn
        y = -y;
      } else if (u_fractalType == 4) { // Phoenix
        vec2 newZ = complexPow(vec2(x, y), u_power) + c + vec2(0.5667, 0.0) * prevZ;
        prevZ = z;
        z = newZ;
        if (dot(z, z) > u_escapeRadius * u_escapeRadius) break;
        iter += 1.0;
        continue;
      } else if (u_fractalType == 5) { // Newton (z^3 - 1)
        vec2 z3 = complexMul(complexMul(z, z), z);
        vec2 z2 = complexMul(z, z);
        z = z - complexDiv(z3 - vec2(1.0, 0.0), 3.0 * z2);
        // Check convergence to roots
        vec2 root1 = vec2(1.0, 0.0);
        vec2 root2 = vec2(-0.5, 0.866);
        vec2 root3 = vec2(-0.5, -0.866);
        if (length(z - root1) < 0.001 || length(z - root2) < 0.001 || length(z - root3) < 0.001) break;
        iter += 1.0;
        continue;
      }

      // Standard power formula
      z = complexPow(vec2(x, y), u_power) + c;

      if (dot(z, z) > u_escapeRadius * u_escapeRadius) break;
      iter += 1.0;
    }

    // Calculate coloring value based on method
    float colorVal;

    if (u_coloringMethod == 0) { // Escape time
      colorVal = iter / maxIter;
    } else if (u_coloringMethod == 1) { // Smooth
      if (iter < maxIter) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(u_power);
        iter = iter + 1.0 - nu;
      }
      colorVal = iter / maxIter;
    } else if (u_coloringMethod == 2) { // Orbit trap
      colorVal = 1.0 - minDist / u_orbitTrapSize;
      colorVal = clamp(colorVal, 0.0, 1.0);
    } else if (u_coloringMethod == 3) { // Angle
      colorVal = totalAngle / (iter * PI * 2.0) + 0.5;
    } else if (u_coloringMethod == 4) { // Stripe
      stripe = stripe / max(iter, 1.0);
      colorVal = stripe * 0.5 + 0.5;
    } else { // Domain coloring
      colorVal = atan(z.y, z.x) / (2.0 * PI) + 0.5;
    }

    // Apply color cycling animation
    colorVal = colorVal * u_colorScale + u_colorOffset + u_time * u_colorCycleSpeed;

    // Get base color
    vec3 color;
    if (iter >= maxIter && u_fractalType != 5) {
      color = vec3(0.0);
    } else {
      color = getColorScheme(colorVal, u_colorScheme);
    }

    // Apply hue shift
    if (u_hueShift > 0.001) {
      vec3 hsv = rgb2hsv(color);
      hsv.x = fract(hsv.x + u_hueShift);
      color = hsv2rgb(hsv);
    }

    // Apply saturation
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(gray), color, u_saturation);

    // Apply brightness
    color *= u_brightness;

    // Apply glow effect
    if (u_glowIntensity > 0.0) {
      float glow = 1.0 - iter / maxIter;
      glow = pow(glow, 3.0) * u_glowIntensity;
      color += glow * getColorScheme(colorVal + 0.5, u_colorScheme);
    }

    // Apply posterization
    if (u_posterize > 1.5) {
      color = floor(color * u_posterize) / u_posterize;
    }

    // Clamp to valid range
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface FractalCanvasProps {
  params: FractalParams;
  onParamsChange: (params: Partial<FractalParams>) => void;
  className?: string;
}

export default function FractalCanvas({ params, onParamsChange, className }: FractalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());

  const fractalTypeToInt = (type: string): number => {
    const types: Record<string, number> = {
      mandelbrot: 0, julia: 1, burningship: 2, tricorn: 3, phoenix: 4, newton: 5
    };
    return types[type] ?? 0;
  };

  const colorSchemeToInt = (scheme: string): number => {
    const schemes: Record<string, number> = {
      classic: 0, smooth: 1, fire: 2, ocean: 3, rainbow: 4, monochrome: 5, psychedelic: 6, neon: 7, pastel: 8
    };
    return schemes[scheme] ?? 0;
  };

  const coloringMethodToInt = (method: string): number => {
    const methods: Record<string, number> = {
      escape: 0, smooth: 1, orbit: 2, angle: 3, stripe: 4, domain: 5
    };
    return methods[method] ?? 1;
  };

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const time = (Date.now() - startTimeRef.current) / 1000;

    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
    gl.uniform2f(gl.getUniformLocation(program, "u_center"), params.centerX, params.centerY);
    gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), params.zoom);
    gl.uniform1i(gl.getUniformLocation(program, "u_maxIterations"), params.maxIterations);
    gl.uniform1f(gl.getUniformLocation(program, "u_escapeRadius"), params.escapeRadius);
    gl.uniform1i(gl.getUniformLocation(program, "u_fractalType"), fractalTypeToInt(params.type));
    gl.uniform1f(gl.getUniformLocation(program, "u_power"), params.power);

    // Julia params - apply animation if enabled
    let juliaReal = params.juliaReal;
    let juliaImag = params.juliaImag;
    if (params.animateJulia) {
      juliaReal = Math.sin(time * params.juliaAnimSpeed * 0.5) * 0.7;
      juliaImag = Math.cos(time * params.juliaAnimSpeed * 0.3) * 0.7;
    }
    gl.uniform2f(gl.getUniformLocation(program, "u_julia"), juliaReal, juliaImag);

    // Coloring
    gl.uniform1i(gl.getUniformLocation(program, "u_colorScheme"), colorSchemeToInt(params.colorScheme));
    gl.uniform1i(gl.getUniformLocation(program, "u_coloringMethod"), coloringMethodToInt(params.coloringMethod));
    gl.uniform1f(gl.getUniformLocation(program, "u_colorOffset"), params.colorOffset);
    gl.uniform1f(gl.getUniformLocation(program, "u_colorScale"), params.colorScale);
    gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
    gl.uniform1f(gl.getUniformLocation(program, "u_colorCycleSpeed"), params.colorCycleSpeed);
    gl.uniform1f(gl.getUniformLocation(program, "u_glowIntensity"), params.glowIntensity);
    gl.uniform1f(gl.getUniformLocation(program, "u_posterize"), params.posterize);
    gl.uniform1f(gl.getUniformLocation(program, "u_hueShift"), params.hueShift);
    gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), params.saturation);
    gl.uniform1f(gl.getUniformLocation(program, "u_brightness"), params.brightness);
    gl.uniform1f(gl.getUniformLocation(program, "u_stripeFrequency"), params.stripeFrequency);
    gl.uniform1f(gl.getUniformLocation(program, "u_orbitTrapSize"), params.orbitTrapSize);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Continue animation if needed
    if (params.colorCycleSpeed > 0 || params.animateJulia) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader));
      return;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error("Fragment shader error:", gl.getShaderInfoLog(fragmentShader));
      return;
    }

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    // Create fullscreen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    render();
  }, [render]);

  useEffect(() => {
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      render();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [render]);

  // Mouse handlers for pan/zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !canvasRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const scale = 2 / (Math.min(canvasRef.current.clientWidth, canvasRef.current.clientHeight) * params.zoom);

    onParamsChange({
      centerX: params.centerX - dx * scale,
      centerY: params.centerY + dy * scale,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    onParamsChange({ zoom: params.zoom * zoomFactor });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing ${className || ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
