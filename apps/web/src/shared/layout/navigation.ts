import {
  Activity,
  BadgeCheck,
  Building2,
  ClipboardList,
  Dumbbell,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Shield,
  UsersRound
} from "lucide-react";
import type { ComponentType } from "react";

export type NavigationRole = "SUPER_ADMIN" | "GYM_ADMIN" | "EMPLOYEE";

export type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  roles: readonly NavigationRole[];
};

export const staffNavigationItems: readonly NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["GYM_ADMIN"]
  },
  {
    label: "Reception",
    href: "/app/reception",
    icon: Dumbbell,
    roles: ["GYM_ADMIN", "EMPLOYEE"]
  },
  {
    label: "Clients",
    href: "/app/clients",
    icon: UsersRound,
    roles: ["GYM_ADMIN", "EMPLOYEE"]
  },
  {
    label: "Staff",
    href: "/app/staff",
    icon: BadgeCheck,
    roles: ["GYM_ADMIN"]
  },
  {
    label: "Membership plans",
    href: "/app/membership-plans",
    icon: ClipboardList,
    roles: ["GYM_ADMIN"]
  },
  {
    label: "Locker keys",
    href: "/app/locker-keys",
    icon: KeyRound,
    roles: ["GYM_ADMIN", "EMPLOYEE"]
  },
  {
    label: "Active visits",
    href: "/app/active-visits",
    icon: Activity,
    roles: ["GYM_ADMIN", "EMPLOYEE"]
  },
  {
    label: "Reports",
    href: "/app/reports",
    icon: Gauge,
    roles: ["GYM_ADMIN"]
  }
];

export const superAdminNavigationItems: readonly NavigationItem[] = [
  {
    label: "Platform",
    href: "/super-admin/dashboard",
    icon: Shield,
    roles: ["SUPER_ADMIN"]
  },
  {
    label: "Organizations",
    href: "/super-admin/organizations",
    icon: Building2,
    roles: ["SUPER_ADMIN"]
  }
];

export function navigationForRole(role: NavigationRole): NavigationItem[] {
  return [...superAdminNavigationItems, ...staffNavigationItems].filter((item) =>
    item.roles.includes(role)
  );
}
