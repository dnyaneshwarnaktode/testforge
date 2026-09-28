"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useApiClient } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { user, isLoaded: userLoaded } = useUser();
  const { fetch: api, isSignedIn, isLoaded: authLoaded, userId } = useApiClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  const loadProjects = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      setLoading(true);
      setError("");
      const data = await api<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (authLoaded) {
      if (isSignedIn) {
        loadProjects();
      } else {
        setProjects([]);
        setError("");
      }
    }
  }, [authLoaded, isSignedIn, userId, loadProjects]);

  async function createProject() {
    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const project = await api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: projectName,
        }),
      });

      setProjects((current) => [project, ...current]);
      setProjectName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project"
      );
    } finally {
      setCreating(false);
    }
  }

  async function claimLegacyProjects() {
    try {
      setClaiming(true);
      setClaimMessage("");
      setError("");

      const res = await api<{ message: string; claimed: number }>(
        "/api/projects/claim-legacy",
        { method: "POST" }
      );

      setClaimMessage(res.message);
      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to claim legacy projects"
      );
    } finally {
      setClaiming(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-8 py-12">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isSignedIn && user?.firstName
                ? `Welcome back, ${user.firstName}`
                : "TestForge Workspace"}
            </h1>

            <p className="mt-2 text-zinc-400">
              {isSignedIn
                ? "Your private, isolated API testing environments"
                : "Automated API testing platform with deterministic assertion validation"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/playground"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              ⚡ API Playground
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {claimMessage && (
          <div className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-300">
            {claimMessage}
          </div>
        )}

        {/* Unauthenticated View */}
        {!isSignedIn && authLoaded && (
          <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
              🔒
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight">
              Secure Multi-Tenant API Testing
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
              Projects, endpoints, assertions, and test run histories are strictly
              scoped to authenticated user accounts. Sign in or create a free
              account to start managing your private test suites.
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </div>
        )}

        {/* Authenticated View */}
        {isSignedIn && (
          <section className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">
                My Test Projects
              </h2>

              <button
                type="button"
                onClick={claimLegacyProjects}
                disabled={claiming}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline disabled:opacity-50"
              >
                {claiming ? "Scanning..." : "Import unassigned legacy projects"}
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createProject();
                }}
                placeholder="New project name"
                className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-500"
              />

              <button
                onClick={createProject}
                disabled={creating}
                className="rounded-lg bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>

            {loading ? (
              <div className="mt-8 text-zinc-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-zinc-800 p-10 text-center">
                <p className="text-zinc-400">No projects found for your account.</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Create your first project above, or click &ldquo;Import unassigned legacy projects&rdquo; to bind any previous test suites to your account.
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
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{project.name}</h3>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                        Owner
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-zinc-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}