"use client";

import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { createGymOpsApiClient } from "../../../shared/api/client";
import { AppShell } from "../../../shared/layout/AppShell";
import { clearSession, readSession, type StoredSession } from "../session-storage";

type ProtectedStaffShellProps = {
  children: ReactNode;
};

export function ProtectedStaffShell({ children }: ProtectedStaffShellProps) {
  const router = useRouter();
  const api = useMemo(
    () =>
      createGymOpsApiClient({
        apiOrigin: process.env["NEXT_PUBLIC_API_ORIGIN"] ?? "http://localhost:4000"
      }),
    []
  );
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const stored = readSession();

    if (stored === null) {
      router.replace("/login");
      return;
    }

    setSession(stored);

    void api
      .me(stored.accessToken)
      .then((staff) => {
        setSession({ ...stored, staff });
      })
      .catch(() => {
        clearSession();
        setIsExpired(true);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [api, router]);

  async function signOut() {
    const stored = readSession();

    if (stored !== null) {
      await api.logout(stored.csrfToken).catch(() => undefined);
    }

    clearSession();
    router.replace("/login");
  }

  if (session === null) {
    return (
      <main className="page-band flex min-h-screen items-center justify-center px-4 text-sm text-[var(--gymops-content-muted)]">
        {isExpired ? null : "Checking session..."}
        <SessionExpiredModal
          isOpen={isExpired}
          onConfirm={() => {
            void signOut();
          }}
        />
      </main>
    );
  }

  const branches =
    session.staff.branches.length > 0
      ? session.staff.branches.map((branch) => ({ id: branch.id, name: branch.name }))
      : [{ id: "platform", name: "Platform" }];
  const currentBranch = session.staff.primaryBranchId ?? branches[0]?.id ?? "platform";

  return (
    <>
      <AppShell
        branches={branches}
        currentBranch={currentBranch}
        organization={
          session.staff.organizationId === null ? "GymOps Platform" : "Northstar Fitness"
        }
        role={session.staff.role}
        staffName={`${session.staff.firstName} ${session.staff.lastName}`}
        onSignOut={() => {
          void signOut();
        }}
      >
        {children}
      </AppShell>
      <SessionExpiredModal
        isOpen={!isChecking && isExpired}
        onConfirm={() => {
          void signOut();
        }}
      />
    </>
  );
}

function SessionExpiredModal({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) {
  return (
    <Modal isOpen={isOpen}>
      <ModalHeader>Session expired</ModalHeader>
      <ModalBody>Your staff session is no longer active.</ModalBody>
      <ModalFooter>
        <Button variant="primary" onPress={onConfirm}>
          Sign in
        </Button>
      </ModalFooter>
    </Modal>
  );
}
