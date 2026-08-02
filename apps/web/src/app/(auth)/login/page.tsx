import { Button, Input } from "@heroui/react";

import { SystemStatusPanel } from "../../../features/system/components/SystemStatusPanel";

export default function StaffLoginPage() {
  return (
    <main className="page-band flex min-h-screen items-center justify-center px-4 py-10">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_24rem] lg:items-center">
        <div>
          <div className="text-sm font-semibold uppercase tracking-normal text-[var(--gymops-primary)]">
            Staff access
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[var(--gymops-content)]">
            GymOps
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--gymops-content-muted)]">
            Staff login shell for the Lean MVP. Authentication behavior is implemented in Phase 4.
          </p>
          <div className="mt-8 max-w-xl">
            <SystemStatusPanel />
          </div>
        </div>

        <form className="rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] p-6 shadow-sm">
          <h2 className="m-0 text-lg font-semibold">Sign in</h2>
          <div className="mt-5 grid gap-4">
            <Input disabled aria-label="Email" placeholder="gym.admin@gymops.local" type="email" />
            <Input disabled aria-label="Password" placeholder="phase-4-pending" type="password" />
            <Button isDisabled type="submit" variant="primary">
              Continue
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
