import Link from "next/link";

import { EmptyState } from "../shared/ui/EmptyState";

export default function NotFoundPage() {
  return (
    <main className="page-band flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <EmptyState
          description="The requested GymOps route is not registered in the frontend shell."
          title="Page not found"
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
