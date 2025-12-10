import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import FractalEditor from "@/components/FractalEditor";
import { FractalParams, FractalType, ColorScheme, ColoringMethod, DEFAULT_FRACTAL_PARAMS } from "@/types/fractal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FractalPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const fractal = await prisma.fractal.findUnique({
    where: { id },
  });

  if (!fractal) {
    notFound();
  }

  // Check access
  if (!fractal.isPublic && fractal.userId !== session?.user?.id) {
    notFound();
  }

  // Parse extra params if they exist
  let extraParams = {};
  if (fractal.extraParams) {
    try {
      extraParams = JSON.parse(fractal.extraParams);
    } catch {
      // ignore parse errors
    }
  }

  const initialParams: FractalParams = {
    ...DEFAULT_FRACTAL_PARAMS,
    type: fractal.type as FractalType,
    centerX: fractal.centerX,
    centerY: fractal.centerY,
    zoom: fractal.zoom,
    maxIterations: fractal.maxIterations,
    escapeRadius: fractal.escapeRadius,
    juliaReal: fractal.juliaReal ?? DEFAULT_FRACTAL_PARAMS.juliaReal,
    juliaImag: fractal.juliaImag ?? DEFAULT_FRACTAL_PARAMS.juliaImag,
    colorScheme: fractal.colorScheme as ColorScheme,
    colorOffset: fractal.colorOffset,
    colorScale: fractal.colorScale,
    ...extraParams,
  };

  return <FractalEditor initialParams={initialParams} fractalId={id} />;
}
