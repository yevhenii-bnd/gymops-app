import type { ReactNode } from "react";

import { ProtectedStaffShell } from "../../features/auth/components/ProtectedStaffShell";

type StaffLayoutProps = {
  children: ReactNode;
};

export default function StaffLayout({ children }: StaffLayoutProps) {
  return <ProtectedStaffShell>{children}</ProtectedStaffShell>;
}
