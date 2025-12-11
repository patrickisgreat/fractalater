"use client";

import { useState } from "react";
import { FractalParams, FractalType, ColorScheme, ColoringMethod } from "@/types/fractal";
import FractalLearn from "./FractalLearn";

interface FractalControlsProps {
  params: FractalParams;
  onParamsChange: (params: Partial<FractalParams>) => void;
  onSave?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
}

const FRACTAL_TYPES: { value: FractalType; label: string; description: string }[] = [
  { value: "mandelbrot", label: "Mandelbrot", description: "z = z^n + c" },
  { value: "julia", label: "Julia Set", description: "Uses constant c" },
  { value: "burningship", label: "Burning Ship", description: "Uses |Re(z)| and |Im(z)|" },
  { value: "tricorn", label: "Tricorn", description: "Uses complex conjugate" },
  { value: "phoenix", label: "Phoenix", description: "Uses previous z value" },
  { value: "newton", label: "Newton", description: "Newton's method for z³-1" },
];

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "classic", label: "Classic Blue" },
  { value: "smooth", label: "Smooth" },
  { value: "fire", label: "Fire" },
  { value: "ocean", label: "Ocean" },
  { value: "rainbow", label: "Rainbow" },
  { value: "monochrome", label: "Monochrome" },
  { value: "psychedelic", label: "Psychedelic" },
  { value: "neon", label: "Neon" },
  { value: "pastel", label: "Pastel" },
];

const COLORING_METHODS: { value: ColoringMethod; label: string; description: string }[] = [
  { value: "escape", label: "Escape Time", description: "Classic iteration count" },
  { value: "smooth", label: "Smooth", description: "Anti-aliased smooth coloring" },
  { value: "orbit", label: "Orbit Trap", description: "Distance to origin" },
  { value: "angle", label: "Angle", description: "Cumulative angle coloring" },
  { value: "stripe", label: "Stripe", description: "Striped pattern overlay" },
  { value: "domain", label: "Domain", description: "Final angle coloring" },
];

type Section = "fractal" | "iteration" | "julia" | "view" | "coloring" | "effects" | "animation" | "learn";

export default function FractalControls({
  params,
  onParamsChange,
  onSave,
  onReset,
  isSaving,
}: FractalControlsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(
    new Set(["fractal", "coloring", "effects"])
  );

  const toggleSection = (section: Section) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const SectionHeader = ({ section, title }: { section: Section; title: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider hover:text-gray-300 py-1 -my-1 touch-manipulation"
    >
      {title}
      <span className="text-lg w-8 h-8 flex items-center justify-center">{expandedSections.has(section) ? "−" : "+"}</span>
    </button>
  );

  return (
    <div className="bg-gray-900 md:border-l border-gray-800 p-3 md:p-4 w-full md:w-80 overflow-y-auto max-h-[calc(70vh-2rem)] md:max-h-full md:h-full">
      <h2 className="text-lg font-semibold text-white mb-4 hidden md:block">Fractal Controls</h2>

      {/* Fractal Type */}
      <div className="mb-4">
        <SectionHeader section="fractal" title="Fractal Type" />
        {expandedSections.has("fractal") && (
          <div className="space-y-3">
            <select
              value={params.type}
              onChange={(e) => onParamsChange({ type: e.target.value as FractalType })}
              className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-base md:text-sm"
            >
              {FRACTAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              {FRACTAL_TYPES.find((t) => t.value === params.type)?.description}
            </p>

            {/* Power slider */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Power (n)</label>
                <span className="text-gray-500">{params.power.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={params.power}
                onChange={(e) => onParamsChange({ power: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-xs text-gray-500">z^n instead of z²</p>
            </div>
          </div>
        )}
      </div>

      {/* Iteration Settings */}
      <div className="mb-4">
        <SectionHeader section="iteration" title="Iteration" />
        {expandedSections.has("iteration") && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Max Iterations</label>
                <span className="text-gray-500">{params.maxIterations}</span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                value={params.maxIterations}
                onChange={(e) => onParamsChange({ maxIterations: parseInt(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Escape Radius</label>
                <span className="text-gray-500">{params.escapeRadius.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="0.5"
                value={params.escapeRadius}
                onChange={(e) => onParamsChange({ escapeRadius: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Julia Set Parameters */}
      {params.type === "julia" && (
        <div className="mb-4">
          <SectionHeader section="julia" title="Julia Constant (c)" />
          {expandedSections.has("julia") && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-gray-300">Real Part</label>
                  <span className="text-gray-500">{params.juliaReal.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={params.juliaReal}
                  onChange={(e) => onParamsChange({ juliaReal: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-gray-300">Imaginary Part</label>
                  <span className="text-gray-500">{params.juliaImag.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.001"
                  value={params.juliaImag}
                  onChange={(e) => onParamsChange({ juliaImag: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Julia Animation */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="animateJulia"
                  checked={params.animateJulia}
                  onChange={(e) => onParamsChange({ animateJulia: e.target.checked })}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="animateJulia" className="text-sm text-gray-300">
                  Animate Julia (morphing)
                </label>
              </div>

              {params.animateJulia && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <label className="text-gray-300">Animation Speed</label>
                    <span className="text-gray-500">{params.juliaAnimSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={params.juliaAnimSpeed}
                    onChange={(e) => onParamsChange({ juliaAnimSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* View Controls */}
      <div className="mb-4">
        <SectionHeader section="view" title="View" />
        {expandedSections.has("view") && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Zoom</label>
                <span className="text-gray-500">{params.zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="-2"
                max="8"
                step="0.01"
                value={Math.log10(params.zoom)}
                onChange={(e) => onParamsChange({ zoom: Math.pow(10, parseFloat(e.target.value)) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Center X</label>
                <input
                  type="number"
                  step="0.01"
                  value={params.centerX}
                  onChange={(e) => onParamsChange({ centerX: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Center Y</label>
                <input
                  type="number"
                  step="0.01"
                  value={params.centerY}
                  onChange={(e) => onParamsChange({ centerY: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Controls */}
      <div className="mb-4">
        <SectionHeader section="coloring" title="Coloring" />
        {expandedSections.has("coloring") && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Color Scheme</label>
              <select
                value={params.colorScheme}
                onChange={(e) => onParamsChange({ colorScheme: e.target.value as ColorScheme })}
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-base md:text-sm"
              >
                {COLOR_SCHEMES.map((scheme) => (
                  <option key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Coloring Method</label>
              <select
                value={params.coloringMethod}
                onChange={(e) => onParamsChange({ coloringMethod: e.target.value as ColoringMethod })}
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-base md:text-sm"
              >
                {COLORING_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {COLORING_METHODS.find((m) => m.value === params.coloringMethod)?.description}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Color Offset</label>
                <span className="text-gray-500">{params.colorOffset.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.colorOffset}
                onChange={(e) => onParamsChange({ colorOffset: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Color Scale</label>
                <span className="text-gray-500">{params.colorScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.01"
                value={params.colorScale}
                onChange={(e) => onParamsChange({ colorScale: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Color Cycling */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Color Cycle Speed</label>
                <span className="text-gray-500">
                  {params.colorCycleSpeed === 0 ? "Off" : params.colorCycleSpeed.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={params.colorCycleSpeed}
                onChange={(e) => onParamsChange({ colorCycleSpeed: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-xs text-gray-500">Animate colors over time</p>
            </div>
          </div>
        )}
      </div>

      {/* Psychedelic Effects */}
      <div className="mb-4">
        <SectionHeader section="effects" title="Psychedelic Effects" />
        {expandedSections.has("effects") && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Hue Shift</label>
                <span className="text-gray-500">{(params.hueShift * 360).toFixed(0)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.hueShift}
                onChange={(e) => onParamsChange({ hueShift: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Saturation</label>
                <span className="text-gray-500">{(params.saturation * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={params.saturation}
                onChange={(e) => onParamsChange({ saturation: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Brightness</label>
                <span className="text-gray-500">{(params.brightness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.01"
                value={params.brightness}
                onChange={(e) => onParamsChange({ brightness: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Glow Intensity</label>
                <span className="text-gray-500">{(params.glowIntensity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={params.glowIntensity}
                onChange={(e) => onParamsChange({ glowIntensity: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-xs text-gray-500">Add glow near the set boundary</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-gray-300">Posterize</label>
                <span className="text-gray-500">
                  {params.posterize < 2 ? "Off" : `${Math.round(params.posterize)} levels`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={params.posterize}
                onChange={(e) => onParamsChange({ posterize: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-xs text-gray-500">Reduce colors for retro look</p>
            </div>

            {params.coloringMethod === "stripe" && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-gray-300">Stripe Frequency</label>
                  <span className="text-gray-500">{params.stripeFrequency.toFixed(0)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={params.stripeFrequency}
                  onChange={(e) => onParamsChange({ stripeFrequency: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
            )}

            {params.coloringMethod === "orbit" && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-gray-300">Orbit Trap Size</label>
                  <span className="text-gray-500">{params.orbitTrapSize.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.01"
                  value={params.orbitTrapSize}
                  onChange={(e) => onParamsChange({ orbitTrapSize: parseFloat(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-Animation Controls */}
      <div className="mb-4">
        <SectionHeader section="animation" title="Auto-Animate" />
        {expandedSections.has("animation") && (
          <div className="space-y-4">
            {/* Performance Mode Toggle */}
            <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-orange-300 font-medium">Performance Mode</label>
                  <p className="text-xs text-orange-400/70 mt-0.5">Lower resolution during animations</p>
                </div>
                <button
                  onClick={() => onParamsChange({ performanceMode: !params.performanceMode })}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    params.performanceMode
                      ? "bg-orange-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {params.performanceMode ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            {/* Global Speed */}
            <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <div className="flex justify-between items-center text-sm mb-1">
                <label className="text-purple-300 font-medium">Global Speed</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={params.globalAnimSpeed}
                  onChange={(e) => onParamsChange({ globalAnimSpeed: parseFloat(e.target.value) || 0.1 })}
                  className="w-16 px-2 py-0.5 bg-purple-900/50 border border-purple-700 rounded text-purple-300 text-right text-sm"
                />
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={params.globalAnimSpeed}
                onChange={(e) => onParamsChange({ globalAnimSpeed: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <p className="text-xs text-purple-400/70 mt-1">Master speed for all animations</p>
            </div>

            {/* Auto Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto Zoom</label>
                <button
                  onClick={() => onParamsChange({ autoZoom: !params.autoZoom })}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    params.autoZoom
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {params.autoZoom ? "ON" : "OFF"}
                </button>
              </div>
              {params.autoZoom && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Speed & Direction</span>
                    <input
                      type="number"
                      min="-10"
                      max="10"
                      step="0.1"
                      value={params.autoZoomSpeed}
                      onChange={(e) => onParamsChange({ autoZoomSpeed: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 text-right text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={params.autoZoomSpeed}
                    onChange={(e) => onParamsChange({ autoZoomSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Auto Rotate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto Drift</label>
                <button
                  onClick={() => onParamsChange({ autoRotate: !params.autoRotate })}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    params.autoRotate
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {params.autoRotate ? "ON" : "OFF"}
                </button>
              </div>
              {params.autoRotate && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Drift Speed</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={params.autoRotateSpeed}
                      onChange={(e) => onParamsChange({ autoRotateSpeed: parseFloat(e.target.value) || 0.1 })}
                      className="w-16 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 text-right text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={params.autoRotateSpeed}
                    onChange={(e) => onParamsChange({ autoRotateSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Auto Hue Shift */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto Hue Cycle</label>
                <button
                  onClick={() => onParamsChange({ autoHueShift: !params.autoHueShift })}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    params.autoHueShift
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {params.autoHueShift ? "ON" : "OFF"}
                </button>
              </div>
              {params.autoHueShift && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Cycle Speed</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.01"
                      value={params.autoHueSpeed}
                      onChange={(e) => onParamsChange({ autoHueSpeed: parseFloat(e.target.value) || 0.01 })}
                      className="w-16 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 text-right text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={params.autoHueSpeed}
                    onChange={(e) => onParamsChange({ autoHueSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Auto Power */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto Power Morph</label>
                <button
                  onClick={() => onParamsChange({ autoPower: !params.autoPower })}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    params.autoPower
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {params.autoPower ? "ON" : "OFF"}
                </button>
              </div>
              {params.autoPower && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-400">Morph Speed</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={params.autoPowerSpeed}
                      onChange={(e) => onParamsChange({ autoPowerSpeed: parseFloat(e.target.value) || 0.1 })}
                      className="w-16 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 text-right text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={params.autoPowerSpeed}
                    onChange={(e) => onParamsChange({ autoPowerSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Quick presets */}
            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Quick Presets</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onParamsChange({
                    autoZoom: true,
                    autoZoomSpeed: 0.03,
                    colorCycleSpeed: 0.05,
                    autoHueShift: false,
                  })}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                >
                  Dive
                </button>
                <button
                  onClick={() => onParamsChange({
                    autoZoom: false,
                    colorCycleSpeed: 0.1,
                    autoHueShift: true,
                    autoHueSpeed: 0.03,
                  })}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                >
                  Trippy
                </button>
                <button
                  onClick={() => onParamsChange({
                    autoZoom: true,
                    autoZoomSpeed: 0.05,
                    autoHueShift: true,
                    autoHueSpeed: 0.03,
                    colorCycleSpeed: 0.08,
                  })}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                >
                  Full Trip
                </button>
                <button
                  onClick={() => onParamsChange({
                    autoZoom: false,
                    autoRotate: false,
                    autoHueShift: false,
                    autoPower: false,
                    colorCycleSpeed: 0,
                  })}
                  className="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded transition"
                >
                  Stop All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learn Section */}
      <div className="mb-4">
        <SectionHeader section="learn" title="Learn" />
        {expandedSections.has("learn") && (
          <FractalLearn params={params} />
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-3 md:py-2 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition touch-manipulation"
          >
            {isSaving ? "Saving..." : "Save Fractal"}
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="w-full py-3 md:py-2 px-4 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-medium rounded-lg transition touch-manipulation"
          >
            Reset to Default
          </button>
        )}
      </div>

      {/* Help Text - hidden on mobile for space */}
      <div className="mt-6 p-3 bg-gray-800/50 rounded-lg hidden md:block">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Tips</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Drag to pan, scroll to zoom</li>
          <li>• Try "Full Trip" for max psychedelia</li>
          <li>• Combine auto-zoom + hue cycle</li>
          <li>• Julia Set + Animate = morphing</li>
        </ul>
      </div>
    </div>
  );
}
