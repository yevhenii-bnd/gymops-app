/** @type {import('jest').Config} */
module.exports = {
  displayName: "unit",
  testEnvironment: "node",
  testMatch: ["<rootDir>/packages/**/*.unit.spec.ts", "<rootDir>/apps/**/*.unit.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.base.json",
        diagnostics: { ignoreCodes: [151002] }
      }
    ]
  },
  collectCoverageFrom: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@gymops/contracts$": "<rootDir>/packages/contracts/src/index.ts",
    "^@gymops/test-data$": "<rootDir>/packages/test-data/src/index.ts"
  }
};
