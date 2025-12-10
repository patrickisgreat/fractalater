import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/fractals - List user's fractals
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fractals = await prisma.fractal.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(fractals);
}

// POST /api/fractals - Create a new fractal
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const fractal = await prisma.fractal.create({
      data: {
        name: data.name,
        description: data.description,
        thumbnail: data.thumbnail,
        type: data.type,
        centerX: data.centerX,
        centerY: data.centerY,
        zoom: data.zoom,
        maxIterations: data.maxIterations,
        escapeRadius: data.escapeRadius,
        juliaReal: data.juliaReal,
        juliaImag: data.juliaImag,
        colorScheme: data.colorScheme,
        colorOffset: data.colorOffset,
        colorScale: data.colorScale,
        isPublic: data.isPublic || false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(fractal);
  } catch (error) {
    console.error("Failed to create fractal:", error);
    return NextResponse.json(
      { error: "Failed to create fractal" },
      { status: 500 }
    );
  }
}
