"use client";

import { useEffect, useRef, useCallback } from "react";
import { FractalParams } from "@/types/fractal";
import vertexShaderSource from "@/shaders/vertex.glsl";
import fragmentShaderSource from "@/shaders/fragment.glsl";

interface FractalCanvasProps {
  params: FractalParams;
  onParamsChange: (params: Partial<FractalParams>) => void;
  className?: string;
  onPerformanceDetected?: (isSlowDevice: boolean) => void;
}

// Detect if we're on a mobile device for performance optimization
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
};

// Resolution scale factors
const INTERACTION_SCALE = 0.5;  // 50% resolution during interaction
const PERFORMANCE_SCALE = 0.25; // 25% resolution in performance mode (more aggressive)
const FULL_SCALE = 1.0;         // 100% resolution when idle
const REFINEMENT_DELAY = 150;   // ms to wait before rendering full quality
const PERF_MAX_ITERATIONS = 100; // Max iterations in performance mode

// Check if any animation is active
const isAnimating = (params: FractalParams) => {
  return params.colorCycleSpeed > 0 ||
         params.animateJulia ||
         params.autoZoom ||
         params.autoRotate ||
         params.autoHueShift ||
         params.autoPower;
};

export default function FractalCanvas({ params, onParamsChange, className, onPerformanceDetected }: FractalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef(0);
  const isMobileRef = useRef(false);

  // Performance optimization refs
  const resolutionScaleRef = useRef(FULL_SCALE);
  const refinementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);
  const renderRef = useRef<() => void>(() => {});

  // Cached uniform locations for performance
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});

  // Performance detection
  const hasRunBenchmarkRef = useRef(false);

  // Check for mobile on mount
  useEffect(() => {
    isMobileRef.current = isMobileDevice();
  }, []);

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

  // Calculate adaptive iterations based on zoom level for "infinite zoom" effect
  const getAdaptiveIterations = useCallback((baseIterations: number, zoom: number, performanceMode: boolean): number => {
    // In performance mode, use fixed low iteration count for smooth animation
    if (performanceMode) {
      return PERF_MAX_ITERATIONS;
    }

    // Increase iterations as we zoom in to maintain detail
    const zoomFactor = Math.log10(Math.max(zoom, 1));
    const adaptiveIterations = Math.floor(baseIterations * (1 + zoomFactor * 0.5));

    // Cap iterations based on device capability
    const maxCap = isMobileRef.current ? 500 : 2000;
    return Math.min(adaptiveIterations, maxCap);
  }, []);

  // Run a quick GPU benchmark to detect slow hardware
  const runBenchmark = useCallback(() => {
    if (hasRunBenchmarkRef.current || !onPerformanceDetected) return;
    hasRunBenchmarkRef.current = true;

    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    // Render several frames and measure time
    const BENCHMARK_FRAMES = 5;
    const startTime = performance.now();

    for (let i = 0; i < BENCHMARK_FRAMES; i++) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      // Use test params that stress the GPU (high iterations at default zoom)
      const u = uniformsRef.current;
      gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
      gl.uniform2f(u.u_center, -0.5, 0.0);
      gl.uniform1f(u.u_zoom, 1.0);
      gl.uniform1i(u.u_maxIterations, 200);
      gl.uniform1f(u.u_escapeRadius, 4.0);
      gl.uniform1i(u.u_fractalType, 0);
      gl.uniform1f(u.u_power, 2.0);
      gl.uniform2f(u.u_julia, 0.0, 0.0);
      gl.uniform1i(u.u_colorScheme, 0);
      gl.uniform1i(u.u_coloringMethod, 1);
      gl.uniform1f(u.u_colorOffset, 0.0);
      gl.uniform1f(u.u_colorScale, 1.0);
      gl.uniform1f(u.u_time, 0.0);
      gl.uniform1f(u.u_colorCycleSpeed, 0.0);
      gl.uniform1f(u.u_glowIntensity, 0.0);
      gl.uniform1f(u.u_posterize, 1.0);
      gl.uniform1f(u.u_hueShift, 0.0);
      gl.uniform1f(u.u_saturation, 1.0);
      gl.uniform1f(u.u_brightness, 1.0);
      gl.uniform1f(u.u_stripeFrequency, 3.0);
      gl.uniform1f(u.u_orbitTrapSize, 0.5);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.finish(); // Force GPU to complete rendering
    }

    const endTime = performance.now();
    const avgFrameTime = (endTime - startTime) / BENCHMARK_FRAMES;

    // If average frame time > 33ms (less than 30fps), consider it slow
    const isSlowDevice = avgFrameTime > 33;
    console.log(`GPU benchmark: ${avgFrameTime.toFixed(2)}ms/frame - ${isSlowDevice ? 'slow' : 'fast'} device`);
    onPerformanceDetected(isSlowDevice);
  }, [onPerformanceDetected]);

  // Update canvas resolution based on scale factor
  const updateCanvasResolution = useCallback((scale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxPixelRatio = isMobileRef.current ? 1.5 : window.devicePixelRatio;
    const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio) * scale;

    canvas.width = canvas.clientWidth * pixelRatio;
    canvas.height = canvas.clientHeight * pixelRatio;
    resolutionScaleRef.current = scale;
  }, []);

  // Start interaction mode (lower resolution for smooth interaction)
  const startInteraction = useCallback(() => {
    if (refinementTimeoutRef.current) {
      clearTimeout(refinementTimeoutRef.current);
      refinementTimeoutRef.current = null;
    }

    if (!isInteractingRef.current) {
      isInteractingRef.current = true;
      updateCanvasResolution(INTERACTION_SCALE);
    }
  }, [updateCanvasResolution]);

  // End interaction mode (schedule high-quality render)
  const endInteraction = useCallback(() => {
    isInteractingRef.current = false;

    if (refinementTimeoutRef.current) {
      clearTimeout(refinementTimeoutRef.current);
    }

    refinementTimeoutRef.current = setTimeout(() => {
      if (resolutionScaleRef.current !== FULL_SCALE) {
        updateCanvasResolution(FULL_SCALE);
        renderRef.current();
      }
    }, REFINEMENT_DELAY);
  }, [updateCanvasResolution]);

  // Convert screen coordinates to fractal coordinates
  const screenToFractal = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // Convert to normalized coordinates (-1 to 1)
    const minDim = Math.min(rect.width, rect.height);
    const nx = (canvasX - rect.width / 2) / minDim * 2;
    const ny = -(canvasY - rect.height / 2) / minDim * 2; // Flip Y

    // Convert to fractal coordinates
    return {
      x: nx / params.zoom + params.centerX,
      y: ny / params.zoom + params.centerY,
    };
  }, [params.zoom, params.centerX, params.centerY]);

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

    // Calculate adaptive iterations for deep zooms
    // Use performance mode when enabled AND animating
    const usePerformance = params.performanceMode && isAnimating(params);
    const effectiveIterations = getAdaptiveIterations(params.maxIterations, params.zoom, usePerformance);

    // Set uniforms using cached locations
    const u = uniformsRef.current;
    gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    gl.uniform2f(u.u_center, params.centerX, params.centerY);
    gl.uniform1f(u.u_zoom, params.zoom);
    gl.uniform1i(u.u_maxIterations, effectiveIterations);
    gl.uniform1f(u.u_escapeRadius, params.escapeRadius);
    gl.uniform1i(u.u_fractalType, fractalTypeToInt(params.type));
    gl.uniform1f(u.u_power, params.power);

    // Julia params - apply animation if enabled
    let juliaReal = params.juliaReal;
    let juliaImag = params.juliaImag;
    if (params.animateJulia) {
      juliaReal = Math.sin(time * params.juliaAnimSpeed * 0.5) * 0.7;
      juliaImag = Math.cos(time * params.juliaAnimSpeed * 0.3) * 0.7;
    }
    gl.uniform2f(u.u_julia, juliaReal, juliaImag);

    // Coloring
    gl.uniform1i(u.u_colorScheme, colorSchemeToInt(params.colorScheme));
    gl.uniform1i(u.u_coloringMethod, coloringMethodToInt(params.coloringMethod));
    gl.uniform1f(u.u_colorOffset, params.colorOffset);
    gl.uniform1f(u.u_colorScale, params.colorScale);
    gl.uniform1f(u.u_time, time);
    gl.uniform1f(u.u_colorCycleSpeed, params.colorCycleSpeed);
    gl.uniform1f(u.u_glowIntensity, params.glowIntensity);
    gl.uniform1f(u.u_posterize, params.posterize);
    gl.uniform1f(u.u_hueShift, params.hueShift);
    gl.uniform1f(u.u_saturation, params.saturation);
    gl.uniform1f(u.u_brightness, params.brightness);
    gl.uniform1f(u.u_stripeFrequency, params.stripeFrequency);
    gl.uniform1f(u.u_orbitTrapSize, params.orbitTrapSize);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Continue animation if needed
    if (params.colorCycleSpeed > 0 || params.animateJulia) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [params, getAdaptiveIterations]);

  // Keep render ref updated for use in callbacks
  renderRef.current = render;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2 not supported");
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

    // Cache all uniform locations for performance
    const uniforms = [
      "u_resolution", "u_center", "u_zoom", "u_maxIterations", "u_escapeRadius",
      "u_fractalType", "u_power", "u_julia", "u_colorScheme", "u_coloringMethod",
      "u_colorOffset", "u_colorScale", "u_time", "u_colorCycleSpeed",
      "u_glowIntensity", "u_posterize", "u_hueShift", "u_saturation",
      "u_brightness", "u_stripeFrequency", "u_orbitTrapSize"
    ];
    uniforms.forEach(name => {
      uniformsRef.current[name] = gl.getUniformLocation(program, name);
    });

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

    // Run benchmark after a short delay to let the initial render complete
    setTimeout(runBenchmark, 100);
  }, [render, runBenchmark]);

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

  // Handle resize with mobile optimization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      // Use current resolution scale (may be reduced during interaction)
      updateCanvasResolution(resolutionScaleRef.current);
      render();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [render, updateCanvasResolution]);

  // Clean up refinement timeout on unmount
  useEffect(() => {
    return () => {
      if (refinementTimeoutRef.current) {
        clearTimeout(refinementTimeoutRef.current);
      }
    };
  }, []);

  // Handle performance mode - reduce resolution during animations
  useEffect(() => {
    const animating = isAnimating(params);

    if (params.performanceMode && animating) {
      // Performance mode + animating = low resolution
      if (resolutionScaleRef.current !== PERFORMANCE_SCALE) {
        updateCanvasResolution(PERFORMANCE_SCALE);
      }
    } else if (!isInteractingRef.current && resolutionScaleRef.current !== FULL_SCALE) {
      // Not in performance mode or not animating, restore full resolution
      updateCanvasResolution(FULL_SCALE);
    }
  }, [params.performanceMode, params.colorCycleSpeed, params.animateJulia, params.autoZoom, params.autoRotate, params.autoHueShift, params.autoPower, updateCanvasResolution]);

  // Mouse handlers for pan/zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    startInteraction();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !canvasRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    // Mark as dragged if moved more than 5 pixels
    if (Math.abs(e.clientX - mouseDownPosRef.current.x) > 5 ||
        Math.abs(e.clientY - mouseDownPosRef.current.y) > 5) {
      hasDraggedRef.current = true;
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    const scale = 2 / (Math.min(canvasRef.current.clientWidth, canvasRef.current.clientHeight) * params.zoom);

    onParamsChange({
      centerX: params.centerX - dx * scale,
      centerY: params.centerY + dy * scale,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    endInteraction();
  };

  // Double-click to set zoom target
  const handleDoubleClick = (e: React.MouseEvent) => {
    const fractalPos = screenToFractal(e.clientX, e.clientY);
    onParamsChange({
      centerX: fractalPos.x,
      centerY: fractalPos.y,
      zoom: params.zoom * 2, // Zoom in 2x on double-click
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    startInteraction();

    // Zoom towards mouse position
    const fractalPosBefore = screenToFractal(e.clientX, e.clientY);
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = params.zoom * zoomFactor;

    // Calculate new center to keep mouse position fixed
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height);
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const nx = (canvasX - rect.width / 2) / minDim * 2;
      const ny = -(canvasY - rect.height / 2) / minDim * 2;

      // New center = old fractal position - screen offset at new zoom
      const newCenterX = fractalPosBefore.x - nx / newZoom;
      const newCenterY = fractalPosBefore.y - ny / newZoom;

      onParamsChange({
        zoom: newZoom,
        centerX: newCenterX,
        centerY: newCenterY,
      });
    } else {
      onParamsChange({ zoom: newZoom });
    }

    endInteraction();
  };

  // Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    const now = Date.now();
    startInteraction();

    if (touches.length === 1) {
      // Check for double-tap
      if (now - lastTapTimeRef.current < 300) {
        // Double-tap detected - zoom to this point
        const fractalPos = screenToFractal(touches[0].clientX, touches[0].clientY);
        onParamsChange({
          centerX: fractalPos.x,
          centerY: fractalPos.y,
          zoom: params.zoom * 2,
        });
        lastTapTimeRef.current = 0;
        endInteraction();
        return;
      }
      lastTapTimeRef.current = now;

      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      lastTouchCenterRef.current = { x: touches[0].clientX, y: touches[0].clientY };
    } else if (touches.length === 2) {
      lastTouchDistanceRef.current = getTouchDistance(touches);
      lastTouchCenterRef.current = getTouchCenter(touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touches = e.touches;
    const currentCenter = getTouchCenter(touches);

    // Handle pinch zoom
    if (touches.length === 2) {
      const currentDistance = getTouchDistance(touches);
      if (currentDistance && lastTouchDistanceRef.current) {
        const zoomFactor = currentDistance / lastTouchDistanceRef.current;
        onParamsChange({ zoom: params.zoom * zoomFactor });
      }
      lastTouchDistanceRef.current = currentDistance;
    }

    // Handle pan
    if (lastTouchCenterRef.current) {
      const dx = currentCenter.x - lastTouchCenterRef.current.x;
      const dy = currentCenter.y - lastTouchCenterRef.current.y;

      const scale = 2 / (Math.min(canvas.clientWidth, canvas.clientHeight) * params.zoom);

      onParamsChange({
        centerX: params.centerX - dx * scale,
        centerY: params.centerY + dy * scale,
      });
    }

    lastTouchCenterRef.current = currentCenter;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
      lastTouchDistanceRef.current = null;
      lastTouchCenterRef.current = null;
      endInteraction();
    } else if (e.touches.length === 1) {
      lastTouchDistanceRef.current = null;
      lastTouchCenterRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing touch-none ${className || ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    />
  );
}
