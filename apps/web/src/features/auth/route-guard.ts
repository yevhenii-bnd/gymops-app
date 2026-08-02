export type StaffRole = "SUPER_ADMIN" | "GYM_ADMIN" | "EMPLOYEE";

export type RouteAccessInput = {
  pathname: string;
  isAuthenticated: boolean;
  role?: StaffRole;
};

export type RouteAccessDecision =
  | { kind: "allow" }
  | { kind: "redirect"; destination: "/login" }
  | { kind: "forbid"; destination: "/403" };

export function resolveRouteAccess(input: RouteAccessInput): RouteAccessDecision {
  if (input.pathname.startsWith("/app") && !input.isAuthenticated) {
    return { kind: "redirect", destination: "/login" };
  }

  if (input.pathname.startsWith("/super-admin") && !input.isAuthenticated) {
    return { kind: "redirect", destination: "/login" };
  }

  if (input.pathname.startsWith("/super-admin") && input.role !== "SUPER_ADMIN") {
    return { kind: "forbid", destination: "/403" };
  }

  return { kind: "allow" };
}
