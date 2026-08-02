import { Button } from "@heroui/react";

type ErrorStateProps = {
  title: string;
  description: string;
  retryAction?: () => void;
  correlationId?: string | undefined;
};

export function ErrorState({ title, description, retryAction, correlationId }: ErrorStateProps) {
  return (
    <section className="rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-6 py-8">
      <h2 className="m-0 text-base font-semibold text-[var(--gymops-danger)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--gymops-content-muted)]">{description}</p>
      {correlationId === undefined ? null : (
        <p className="mt-3 text-xs text-[var(--gymops-content-muted)]">
          Correlation ID: <span className="font-mono">{correlationId}</span>
        </p>
      )}
      {retryAction === undefined ? null : (
        <Button className="mt-5" variant="secondary" onPress={retryAction}>
          Retry
        </Button>
      )}
    </section>
  );
}
