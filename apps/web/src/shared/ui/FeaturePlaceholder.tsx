import { Card } from "@heroui/react";

import { EmptyState, PlaceholderAction } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { StatusChip } from "./StatusChip";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  uiId: string;
  phase: string;
};

export function FeaturePlaceholder({ title, description, uiId, phase }: FeaturePlaceholderProps) {
  return (
    <>
      <PageHeader breadcrumbs={["GymOps", uiId]} description={description} title={title} />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <EmptyState
          action={<PlaceholderAction />}
          description="This route is wired into the shell now. Business behavior will be implemented in its owning phase."
          title="Feature skeleton"
        />
        <Card className="rounded-md" variant="default">
          <Card.Content className="gap-3">
            <StatusChip domain="system" label="ready" status="ok" />
            <div className="text-sm text-[var(--gymops-content-muted)]">UI ID: {uiId}</div>
            <div className="text-sm text-[var(--gymops-content-muted)]">Owning phase: {phase}</div>
          </Card.Content>
        </Card>
      </div>
    </>
  );
}
