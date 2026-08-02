import type { ReactNode } from "react";

import { AppShell } from "../../shared/layout/AppShell";

const phaseThreeBranches = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Main Branch"
  }
] as const;

type StaffLayoutProps = {
  children: ReactNode;
};

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <AppShell
      branches={phaseThreeBranches}
      currentBranch={phaseThreeBranches[0].id}
      organization="GymOps Local"
      role="GYM_ADMIN"
      staffName="Gym Admin"
    >
      {children}
    </AppShell>
  );
}
