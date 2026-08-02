import { Chip, type ChipProps } from "@heroui/react";

type StatusDomain = "membership" | "key" | "visit" | "incident" | "system";

type StatusChipProps = {
  domain: StatusDomain;
  status: string;
  label: string;
};

const colorByStatus = {
  active: "success",
  available: "success",
  completed: "success",
  ok: "success",
  frozen: "warning",
  maintenance: "warning",
  "auto-closed": "warning",
  blocked: "danger",
  damaged: "danger",
  expired: "danger",
  lost: "danger",
  unavailable: "danger",
  incident: "danger",
  issued: "accent",
  open: "accent",
  resolved: "success"
} satisfies Record<string, ChipProps["color"]>;

export function StatusChip({ domain, status, label }: StatusChipProps) {
  const color = (colorByStatus as Record<string, ChipProps["color"]>)[status] ?? "default";

  return (
    <Chip color={color} size="sm" variant="soft">
      {domain}: {label}
    </Chip>
  );
}
