"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [projectName, setProjectName] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  async function loadProjects() {
    try {
      setLoading(true);

      const data =
        await apiFetch<Project[]>(
          "/api/projects"
        );

      setProjects(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);

      const project =
        await apiFetch<Project>(
          "/api/projects",
          {
            method: "POST",
            body: JSON.stringify({
              name: projectName,
            }),
          }
        );

      setProjects((current) => [
        project,
        ...current,
      ]);

      setProjectName("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project"
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-6xl px-8 py-12">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              TestForge
            </h1>

            <p className="mt-2 text-zinc-400">
              API testing workspace
            </p>
          </div>

        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold">
              Projects
            </h2>

          </div>

          <div className="mt-4 flex gap-3">

            <input
              value={projectName}
              onChange={(event) =>
                setProjectName(
                  event.target.value
                )
              }
              placeholder="Project name"
              className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
            />

            <button
              onClick={createProject}
              disabled={creating}
              className="rounded-lg bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Project"}
            </button>

          </div>

          {loading ? (
            <div className="mt-8 text-zinc-500">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-zinc-800 p-10 text-center">
              <p className="text-zinc-400">
                No projects yet.
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Create your first project above.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-600"
                >

                  <h3 className="font-semibold">
                    {project.name}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    Created{" "}
                    {new Date(
                      project.createdAt
                    ).toLocaleDateString()}
                  </p>

                </Link>
              ))}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}