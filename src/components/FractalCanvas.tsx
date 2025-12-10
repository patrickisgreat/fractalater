"use client";

import { useEffect, useRef, useCallback } from "react";
import { FractalParams } from "@/types/fractal";
import vertexShaderSource from "@/shaders/vertex.glsl";
import fragmentShaderSource from "@/shaders/fragment.glsl";

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
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

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

    if (touches.length === 1) {
      isDraggingRef.current = true;
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
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    />
  );
}
