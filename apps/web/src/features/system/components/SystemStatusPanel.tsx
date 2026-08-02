"use client";

import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { loadWebConfig } from "../../../app-config";
import {
  createGymOpsApiClient,
  GymOpsApiError,
  type HealthResponse,
  type VersionResponse
} from "../../../shared/api/client";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { StatusChip } from "../../../shared/ui/StatusChip";

type SystemStatus =
  | { kind: "loading" }
  | { kind: "ready"; health: HealthResponse; version: VersionResponse }
  | { kind: "error"; title: string; detail: string; correlationId?: string };

export function SystemStatusPanel() {
  const config = loadWebConfig();
  const client = useMemo(
    () => createGymOpsApiClient({ apiOrigin: config.apiOrigin }),
    [config.apiOrigin]
  );
  const [status, setStatus] = useState<SystemStatus>({ kind: "loading" });

  async function refresh() {
    setStatus({ kind: "loading" });

    try {
      const [health, version] = await Promise.all([client.health(), client.version()]);
      setStatus({ kind: "ready", health, version });
    } catch (error) {
      if (error instanceof GymOpsApiError) {
        setStatus({
          kind: "error",
          title: error.problem.title,
          detail: error.problem.detail,
          ...(error.problem.correlationId === undefined
            ? {}
            : { correlationId: error.problem.correlationId })
        });
        return;
      }

      setStatus({
        kind: "error",
        title: "API unavailable",
        detail: "The local API is not reachable from the frontend shell."
      });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  if (status.kind === "loading") {
    return (
      <section
        aria-label="System status"
        className="rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] p-4"
      >
        <div className="text-sm text-[var(--gymops-content-muted)]">Checking API status...</div>
      </section>
    );
  }

  if (status.kind === "error") {
    return (
      <section aria-label="System status">
        <ErrorState
          correlationId={status.correlationId}
          description={status.detail}
          retryAction={() => {
            void refresh();
          }}
          title={status.title}
        />
      </section>
    );
  }

  return (
    <section
      aria-label="System status"
      className="rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <StatusChip domain="system" label={status.health.status} status={status.health.status} />
        <Button
          isIconOnly
          aria-label="Refresh system status"
          size="sm"
          variant="ghost"
          onPress={() => {
            void refresh();
          }}
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--gymops-content-muted)]">API service</dt>
          <dd className="m-0 font-medium">{status.health.service}</dd>
        </div>
        <div>
          <dt className="text-[var(--gymops-content-muted)]">Version</dt>
          <dd className="m-0 font-medium">{status.version.version}</dd>
        </div>
      </dl>
    </section>
  );
}
