import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/fractals/[id] - Get a single fractal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const fractal = await prisma.fractal.findUnique({
    where: { id },
  });

  if (!fractal) {
    return NextResponse.json({ error: "Fractal not found" }, { status: 404 });
  }

  // Check access - must be owner or fractal must be public
  if (!fractal.isPublic && fractal.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(fractal);
}

// PUT /api/fractals/[id] - Update a fractal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingFractal = await prisma.fractal.findUnique({
    where: { id },
  });

  if (!existingFractal) {
    return NextResponse.json({ error: "Fractal not found" }, { status: 404 });
  }

  if (existingFractal.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const fractal = await prisma.fractal.update({
      where: { id },
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
        isPublic: data.isPublic,
      },
    });

    return NextResponse.json(fractal);
  } catch (error) {
    console.error("Failed to update fractal:", error);
    return NextResponse.json(
      { error: "Failed to update fractal" },
      { status: 500 }
    );
  }
}

// DELETE /api/fractals/[id] - Delete a fractal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingFractal = await prisma.fractal.findUnique({
    where: { id },
  });

  if (!existingFractal) {
    return NextResponse.json({ error: "Fractal not found" }, { status: 404 });
  }

  if (existingFractal.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.fractal.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
