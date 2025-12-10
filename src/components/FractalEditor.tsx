"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import FractalCanvas from "./FractalCanvas";
import FractalControls from "./FractalControls";
import SaveModal from "./SaveModal";
import Logo from "./Logo";
import { FractalParams, DEFAULT_FRACTAL_PARAMS } from "@/types/fractal";

interface FractalEditorProps {
  initialParams?: FractalParams;
  fractalId?: string;
}

export default function FractalEditor({ initialParams, fractalId }: FractalEditorProps) {
  const { data: session } = useSession();
  const [params, setParams] = useState<FractalParams>(initialParams || DEFAULT_FRACTAL_PARAMS);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const handleParamsChange = useCallback((newParams: Partial<FractalParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_FRACTAL_PARAMS);
  }, []);

  // Auto-animation loop
  useEffect(() => {
    const hasAnimation =
      params.autoZoom ||
      params.autoRotate ||
      params.autoHueShift ||
      params.autoPower ||
      params.colorCycleSpeed > 0 ||
      params.animateJulia;

    if (!hasAnimation) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = currentTime;

      const speed = params.globalAnimSpeed;

      setParams((prev) => {
        const updates: Partial<FractalParams> = {};

        // Auto zoom - exponential growth/decay
        if (prev.autoZoom) {
          const zoomFactor = Math.exp(prev.autoZoomSpeed * speed * deltaTime);
          updates.zoom = prev.zoom * zoomFactor;
        }

        // Auto rotate - move around current center in a circle
        if (prev.autoRotate) {
          const radius = 0.01 / prev.zoom; // Smaller radius at higher zoom
          const t = Date.now() / 1000 * prev.autoRotateSpeed * speed;
          updates.centerX = prev.centerX + Math.cos(t) * radius * deltaTime;
          updates.centerY = prev.centerY + Math.sin(t) * radius * deltaTime;
        }

        // Auto hue shift
        if (prev.autoHueShift) {
          updates.hueShift = (prev.hueShift + prev.autoHueSpeed * speed * deltaTime) % 1;
        }

        // Auto power oscillation
        if (prev.autoPower) {
          const powerOsc = Math.sin(Date.now() / 1000 * prev.autoPowerSpeed * speed);
          updates.power = 2 + powerOsc * 2; // Oscillate between 0 and 4, centered on 2
        }

        return { ...prev, ...updates };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    params.autoZoom,
    params.autoRotate,
    params.autoHueShift,
    params.autoPower,
    params.colorCycleSpeed,
    params.animateJulia,
    params.globalAnimSpeed,
    params.autoZoomSpeed,
    params.autoRotateSpeed,
    params.autoHueSpeed,
    params.autoPowerSpeed,
  ]);

  const handleSave = useCallback(
    async (name: string, description: string, isPublic: boolean) => {
      if (!session) return;

      setIsSaving(true);
      try {
        const endpoint = fractalId ? `/api/fractals/${fractalId}` : "/api/fractals";
        const method = fractalId ? "PUT" : "POST";

        const res = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            isPublic,
            ...params,
          }),
        });

        if (res.ok) {
          setIsSaveModalOpen(false);
        }
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [session, params, fractalId]
  );

  // Check if any animation is active
  const isAnimating =
    params.autoZoom ||
    params.autoRotate ||
    params.autoHueShift ||
    params.autoPower ||
    params.colorCycleSpeed > 0 ||
    params.animateJulia;

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="h-12 md:h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 md:px-4 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>
          <span className="hidden sm:inline text-gray-500 text-sm">
            {params.type.charAt(0).toUpperCase() + params.type.slice(1)} Set
          </span>
          {isAnimating && (
            <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded-full animate-pulse">
              Animating
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {session ? (
            <>
              <Link
                href="/gallery"
                className="hidden sm:inline text-gray-400 hover:text-white text-sm transition"
              >
                My Fractals
              </Link>
              <span className="hidden sm:inline text-gray-600">|</span>
              <span className="hidden md:inline text-gray-400 text-sm">{session.user?.email}</span>
              <Link
                href="/api/auth/signout"
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Canvas */}
        <div className="flex-1 relative min-h-0">
          <FractalCanvas
            params={params}
            onParamsChange={handleParamsChange}
          />

          {/* Status overlay */}
          <div className="absolute bottom-20 md:bottom-4 left-4 flex flex-col gap-2">
            <div className="bg-gray-900/80 px-3 py-1 rounded-lg text-sm text-gray-300">
              Zoom: {params.zoom < 1000 ? params.zoom.toFixed(2) : params.zoom.toExponential(2)}x
            </div>
            {params.autoZoom && (
              <div className="bg-purple-900/80 px-3 py-1 rounded-lg text-xs text-purple-300">
                Auto-zoom: {params.autoZoomSpeed > 0 ? "In" : "Out"}
              </div>
            )}
          </div>

        </div>

        {/* Mobile controls toggle button - positioned fixed for visibility */}
        {!isControlsOpen && (
          <button
            onClick={() => setIsControlsOpen(true)}
            className="md:hidden fixed bottom-6 right-4 w-16 h-16 bg-purple-600 hover:bg-purple-700 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 z-40 border-2 border-purple-400"
            aria-label="Open controls"
            style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Controls Panel - Desktop: side panel, Mobile: bottom sheet */}
        <div
          className={`
            md:relative md:flex-shrink-0 md:h-full md:overflow-hidden
            fixed md:static inset-x-0 bottom-0 md:inset-auto
            transform transition-transform duration-300 ease-out
            ${isControlsOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
            z-30 md:z-auto
            max-h-[70vh] md:max-h-full
          `}
        >
          {/* Mobile drag handle */}
          <div className="md:hidden bg-gray-900 border-t border-gray-800 flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-700 rounded-full" />
          </div>
          <FractalControls
            params={params}
            onParamsChange={handleParamsChange}
            onSave={session ? () => setIsSaveModalOpen(true) : undefined}
            onReset={handleReset}
            isSaving={isSaving}
          />
        </div>

        {/* Mobile backdrop */}
        {isControlsOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsControlsOpen(false)}
          />
        )}
      </div>

      {/* Save Modal */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
