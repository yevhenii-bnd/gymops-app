import Link from "next/link";

import { ErrorState } from "../../../shared/ui/ErrorState";

export default function ForbiddenPage() {
  return (
    <main className="page-band flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <ErrorState
          description="The current staff context does not have permission to open this workspace."
          title="Forbidden"
        />
        <Link
          className="mt-5 inline-flex h-10 items-center rounded-md bg-[var(--gymops-primary)] px-4 text-sm font-medium text-white"
          href="/login"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
