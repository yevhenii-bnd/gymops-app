/** @type {import('jest').Config} */
module.exports = {
  displayName: "unit",
  testEnvironment: "node",
  testMatch: ["**/packages/**/*.unit.spec.ts", "**/apps/**/*.unit.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.base.json",
        diagnostics: { ignoreCodes: [151002] }
      }
    ]
  },
  collectCoverageFrom: [
    "packages/contracts/src/**/*.ts",
    "apps/api/src/app-config.ts",
    "apps/api/src/modules/identity/security/**/*.ts",
    "apps/web/src/app-config.ts",
    "apps/web/src/features/auth/route-guard.ts",
    "apps/web/src/shared/api/**/*.ts",
    "!**/*.unit.spec.ts",
    "!**/index.ts"
  ],
  // Coverage gate is scoped to unit-testable runtime logic. Portfolio target after MVP hardening: 80/75/80/80.
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 65,
      functions: 75,
      lines: 75
    }
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@gymops/contracts$": "<rootDir>/packages/contracts/src/index.ts",
    "^@gymops/test-data$": "<rootDir>/packages/test-data/src/index.ts"
  }
};
