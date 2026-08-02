"use client";

import { Button, Chip } from "@heroui/react";
import { LogOut, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  BranchSelector,
  type BranchOption
} from "../../features/branches/components/BranchSelector";
import { navigationForRole, type NavigationRole } from "./navigation";

type AppShellProps = {
  children: ReactNode;
  role: NavigationRole;
  organization: string;
  branches: readonly BranchOption[];
  currentBranch: string;
  staffName: string;
};

export function AppShell({
  children,
  role,
  organization,
  branches,
  currentBranch,
  staffName
}: AppShellProps) {
  const pathname = usePathname();
  const navigationItems = navigationForRole(role);

  return (
    <div className="min-h-screen bg-[var(--gymops-background)] text-[var(--gymops-content)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-4 py-5 lg:block">
          <div className="mb-6">
            <div className="text-xl font-semibold">GymOps</div>
            <div className="mt-1 text-sm text-[var(--gymops-content-muted)]">{organization}</div>
          </div>

          <nav aria-label="Main navigation" className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
                    isActive
                      ? "bg-[var(--gymops-surface-subtle)] text-[var(--gymops-primary-strong)]"
                      : "text-[var(--gymops-content-muted)] hover:bg-[var(--gymops-surface-subtle)] hover:text-[var(--gymops-content)]"
                  ].join(" ")}
                  href={item.href}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button isIconOnly aria-label="Open navigation" className="lg:hidden" variant="ghost">
                <Menu size={20} />
              </Button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{staffName}</div>
                <div className="truncate text-xs text-[var(--gymops-content-muted)]">{role}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BranchSelector branches={branches} isReadOnly value={currentBranch} />
              <Chip color="accent" size="sm" variant="soft">
                Phase 3
              </Chip>
              <Button isIconOnly aria-label="Sign out" variant="ghost">
                <LogOut size={18} />
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] px-3 py-2 text-xs text-[var(--gymops-content-muted)] shadow-sm">
        <UserRound size={14} />
        <span>Shell foundation</span>
      </div>
    </div>
  );
}
