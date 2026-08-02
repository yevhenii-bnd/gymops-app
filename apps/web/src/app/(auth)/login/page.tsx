import { StaffLoginForm } from "../../../features/auth/components/StaffLoginForm";
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
            Staff access for local MVP workflows.
          </p>
          <div className="mt-8 max-w-xl">
            <SystemStatusPanel />
          </div>
        </div>

        <StaffLoginForm />
      </section>
    </main>
  );
}
