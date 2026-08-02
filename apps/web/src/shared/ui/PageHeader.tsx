import type { ReactNode } from "react";

type PageHeaderProps = {
  breadcrumbs?: readonly string[];
  title: string;
  description?: string;
  primaryAction?: ReactNode;
};

export function PageHeader({
  breadcrumbs = [],
  title,
  description,
  primaryAction
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--gymops-border)] pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {breadcrumbs.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2 text-xs text-[var(--gymops-content-muted)]">
            {breadcrumbs.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        <h1 className="m-0 text-2xl font-semibold tracking-normal text-[var(--gymops-content)]">
          {title}
        </h1>
        {description === undefined ? null : (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--gymops-content-muted)]">
            {description}
          </p>
        )}
      </div>
      {primaryAction === undefined ? null : <div className="shrink-0">{primaryAction}</div>}
    </header>
  );
}
