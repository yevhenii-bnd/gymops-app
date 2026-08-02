import { Button } from "@heroui/react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-6 py-10 text-center">
      <h2 className="m-0 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--gymops-content-muted)]">
        {description}
      </p>
      {action === undefined ? null : <div className="mt-5">{action}</div>}
    </section>
  );
}

export function PlaceholderAction() {
  return (
    <Button isDisabled variant="secondary">
      Planned in feature phase
    </Button>
  );
}
