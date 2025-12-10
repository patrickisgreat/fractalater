"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Fractal {
  id: string;
  name: string;
  description: string | null;
  type: string;
  thumbnail: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fractals, setFractals] = useState<Fractal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchFractals();
    }
  }, [session]);

  const fetchFractals = async () => {
    try {
      const res = await fetch("/api/fractals");
      if (res.ok) {
        const data = await res.json();
        setFractals(data);
      }
    } catch (error) {
      console.error("Failed to fetch fractals:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFractal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fractal?")) return;

    try {
      const res = await fetch(`/api/fractals/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFractals((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete fractal:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white">
            Fractalater
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">My Fractals</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
          >
            + New Fractal
          </Link>
          <span className="text-gray-400 text-sm">{session?.user?.email}</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {fractals.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-white mb-2">
              No fractals yet
            </h2>
            <p className="text-gray-400 mb-6">
              Create your first fractal to get started!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
            >
              Create Fractal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fractals.map((fractal) => (
              <div
                key={fractal.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group"
              >
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  {fractal.thumbnail ? (
                    <img
                      src={fractal.thumbnail}
                      alt={fractal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 text-4xl">
                      {fractal.type === "mandelbrot" && "M"}
                      {fractal.type === "julia" && "J"}
                      {fractal.type === "burningship" && "B"}
                      {fractal.type === "tricorn" && "T"}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white truncate">
                      {fractal.name}
                    </h3>
                    {fractal.isPublic && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Public
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {fractal.description || `${fractal.type} fractal`}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(fractal.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/fractal/${fractal.id}`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => deleteFractal(fractal.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
