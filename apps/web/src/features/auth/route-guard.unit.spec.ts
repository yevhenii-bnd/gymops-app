import { resolveRouteAccess } from "./route-guard.js";

describe("resolveRouteAccess", () => {
  it("redirects anonymous staff app routes to login", () => {
    expect(resolveRouteAccess({ pathname: "/app/dashboard", isAuthenticated: false })).toEqual({
      kind: "redirect",
      destination: "/login"
    });
  });

  it("forbids non-super-admin users from super-admin routes", () => {
    expect(
      resolveRouteAccess({
        pathname: "/super-admin/dashboard",
        isAuthenticated: true,
        role: "GYM_ADMIN"
      })
    ).toEqual({
      kind: "forbid",
      destination: "/403"
    });
  });
});
