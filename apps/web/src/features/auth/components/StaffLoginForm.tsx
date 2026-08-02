"use client";

import { Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, SyntheticEvent, useMemo, useState } from "react";

import { createGymOpsApiClient, GymOpsApiError } from "../../../shared/api/client";
import { saveSession } from "../session-storage";

const defaultEmail = "gym.admin@gymops.local";
const defaultPassword = "LocalOnly!ChangeMe123";

export function StaffLoginForm() {
  const router = useRouter();
  const api = useMemo(
    () =>
      createGymOpsApiClient({
        apiOrigin: process.env["NEXT_PUBLIC_API_ORIGIN"] ?? "http://localhost:4000"
      }),
    []
  );
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await api.login({ email, password });
      saveSession({
        accessToken: session.accessToken,
        csrfToken: session.csrfToken,
        staff: session.staff
      });
      router.push(
        session.staff.role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/app/dashboard"
      );
    } catch (caught) {
      if (caught instanceof GymOpsApiError) {
        setError(caught.problem.detail);
      } else {
        setError("Sign in failed. Check that the local API and database are running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateEmail(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  function updatePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  return (
    <form
      className="rounded-md border border-[var(--gymops-border)] bg-[var(--gymops-surface)] p-6 shadow-sm"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <h2 className="m-0 text-lg font-semibold">Sign in</h2>
      <div className="mt-5 grid gap-4">
        <Input
          aria-label="Email"
          autoComplete="username"
          name="email"
          required
          type="email"
          value={email}
          onChange={updateEmail}
        />
        <Input
          aria-label="Password"
          autoComplete="current-password"
          name="password"
          required
          type="password"
          value={password}
          onChange={updatePassword}
        />
        {error !== null ? (
          <div
            className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        <Button isDisabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting ? "Signing in" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
