import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-black text-sm">
            TF
          </span>
          <span className="font-bold text-lg tracking-tight text-white">
            TestForge
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/playground"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            ⚡ Playground
          </Link>

          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 ring-1 ring-zinc-700",
                  },
                }}
              />
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
